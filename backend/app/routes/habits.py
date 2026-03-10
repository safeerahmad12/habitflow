from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_db, get_current_user_optional

router = APIRouter(prefix="/habits", tags=["Habits"])


def today_bounds():
    now = datetime.utcnow()
    start = datetime(now.year, now.month, now.day)
    end = start + timedelta(days=1)
    return start, end


def calculate_streaks(logs):
    completed_dates = sorted(
        {log.date.date() for log in logs if log.completed},
        reverse=True,
    )

    if not completed_dates:
        return 0, 0, 0

    longest = 1
    current_run = 1

    for i in range(len(completed_dates) - 1):
        diff = (completed_dates[i] - completed_dates[i + 1]).days
        if diff == 1:
            current_run += 1
            longest = max(longest, current_run)
        elif diff == 0:
            continue
        else:
            current_run = 1

    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)

    if completed_dates[0] not in [today, yesterday]:
        current = 0
    else:
        current = 1
        anchor = completed_dates[0]
        for next_date in completed_dates[1:]:
            diff = (anchor - next_date).days
            if diff == 1:
                current += 1
                anchor = next_date
            elif diff == 0:
                continue
            else:
                break

    return current, longest, len(completed_dates)


def serialize_habit(habit):
    logs = habit.logs or []
    current_streak, longest_streak, total_completions = calculate_streaks(logs)

    start, end = today_bounds()
    completed_today = any(
        log.completed and start <= log.date < end
        for log in logs
    )

    return {
        "id": habit.id,
        "title": habit.title,
        "description": habit.description,
        "category": habit.category,
        "frequency": habit.frequency,
        "user_id": habit.user_id,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_completions": total_completions,
        "completed_today": completed_today,
    }


def get_user_habits_query(db: Session, current_user):
    query = db.query(models.Habit)

    if current_user:
        query = query.filter(models.Habit.user_id == current_user.id)
    else:
        query = query.filter(models.Habit.user_id == None)

    return query


@router.get("/", response_model=list[schemas.HabitResponse])
def get_habits(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    habits = get_user_habits_query(db, current_user).all()
    return [serialize_habit(habit) for habit in habits]


@router.post("/", response_model=schemas.HabitResponse)
def create_habit(
    habit: schemas.HabitCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    new_habit = models.Habit(
        title=habit.title,
        description=habit.description,
        category=habit.category,
        frequency=habit.frequency,
        user_id=current_user.id if current_user else None,
    )
    db.add(new_habit)
    db.commit()
    db.refresh(new_habit)
    return serialize_habit(new_habit)


@router.put("/{habit_id}", response_model=schemas.HabitResponse)
def update_habit(
    habit_id: int,
    habit: schemas.HabitCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    db_habit = (
        get_user_habits_query(db, current_user)
        .filter(models.Habit.id == habit_id)
        .first()
    )

    if not db_habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    db_habit.title = habit.title
    db_habit.description = habit.description
    db_habit.category = habit.category
    db_habit.frequency = habit.frequency

    db.commit()
    db.refresh(db_habit)
    return serialize_habit(db_habit)


@router.delete("/{habit_id}")
def delete_habit(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    db_habit = (
        get_user_habits_query(db, current_user)
        .filter(models.Habit.id == habit_id)
        .first()
    )

    if not db_habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    db.delete(db_habit)
    db.commit()
    return {"message": "Habit deleted successfully"}


@router.post("/{habit_id}/complete")
def complete_habit_today(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    habit = (
        get_user_habits_query(db, current_user)
        .filter(models.Habit.id == habit_id)
        .first()
    )

    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    start, end = today_bounds()

    existing_log = (
        db.query(models.HabitLog)
        .filter(
            models.HabitLog.habit_id == habit_id,
            models.HabitLog.completed == True,
            models.HabitLog.date >= start,
            models.HabitLog.date < end,
        )
        .first()
    )

    if existing_log:
        return {"message": "Habit already completed today"}

    log = models.HabitLog(
        habit_id=habit_id,
        completed=True,
        date=datetime.utcnow(),
        notes="Completed from dashboard",
    )
    db.add(log)
    db.commit()

    return {"message": "Habit marked complete for today"}

@router.delete("/{habit_id}/complete")
def undo_habit_today(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    habit = (
        get_user_habits_query(db, current_user)
        .filter(models.Habit.id == habit_id)
        .first()
    )

    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    start, end = today_bounds()

    log = (
        db.query(models.HabitLog)
        .filter(
            models.HabitLog.habit_id == habit_id,
            models.HabitLog.completed == True,
            models.HabitLog.date >= start,
            models.HabitLog.date < end,
        )
        .first()
    )

    if not log:
        raise HTTPException(status_code=404, detail="No completion found for today")

    db.delete(log)
    db.commit()

    return {"message": "Today's completion removed"}


@router.get("/analytics/weekly")
def weekly_progress(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    today = datetime.utcnow()
    start_day = datetime(today.year, today.month, today.day) - timedelta(days=6)

    habit_ids = [
        habit.id for habit in get_user_habits_query(db, current_user).all()
    ]

    result = []
    for i in range(7):
        day_start = start_day + timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        if habit_ids:
            count = (
                db.query(models.HabitLog)
                .filter(
                    models.HabitLog.habit_id.in_(habit_ids),
                    models.HabitLog.completed == True,
                    models.HabitLog.date >= day_start,
                    models.HabitLog.date < day_end,
                )
                .count()
            )
        else:
            count = 0

        result.append(
            {
                "label": day_start.strftime("%a"),
                "count": count,
            }
        )

    return result


@router.get("/analytics/heatmap")
def heatmap_data(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    today = datetime.utcnow()
    start_day = datetime(today.year, today.month, today.day) - timedelta(days=34)

    habit_ids = [
        habit.id for habit in get_user_habits_query(db, current_user).all()
    ]

    data = []
    for i in range(35):
        day_start = start_day + timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        if habit_ids:
            count = (
                db.query(models.HabitLog)
                .filter(
                    models.HabitLog.habit_id.in_(habit_ids),
                    models.HabitLog.completed == True,
                    models.HabitLog.date >= day_start,
                    models.HabitLog.date < day_end,
                )
                .count()
            )
        else:
            count = 0

        data.append(
            {
                "date": day_start.strftime("%Y-%m-%d"),
                "count": count,
            }
        )

    return data
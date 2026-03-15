from sqlalchemy.orm import Session
from datetime import date
import models, schemas

def get_tasks_by_date(db: Session, task_date: date):
    return db.query(models.Task).filter(models.Task.date == task_date).all()

def create_daily_tasks(db: Session, task_date: date):
    task_types = ["八股文阅读", "算法刷题（3道）", "个人项目开发"]
    tasks = []
    for t_type in task_types:
        db_task = models.Task(date=task_date, task_type=t_type)
        db.add(db_task)
        tasks.append(db_task)
    db.commit()
    for task in tasks:
        db.refresh(task)
    return tasks

def update_task(db: Session, task_id: int, task_update: schemas.TaskUpdate):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task:
        if task_update.is_completed is not None:
            db_task.is_completed = task_update.is_completed
        if task_update.note is not None:
            db_task.note = task_update.note
        db.commit()
        db.refresh(db_task)
    return db_task

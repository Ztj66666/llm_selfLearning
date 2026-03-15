from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

class TaskBase(BaseModel):
    task_type: str
    is_completed: bool = False
    note: Optional[str] = None
    date: date
    data: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    is_completed: Optional[bool] = None
    note: Optional[str] = None
    data: Optional[str] = None

class Task(TaskBase):
    id: int

    class Config:
        orm_mode = True

class ProblemBase(BaseModel):
    title: str
    difficulty: str
    tags: str
    url: Optional[str] = None
    stage: str

class Problem(ProblemBase):
    id: int

    class Config:
        orm_mode = True

class UserProgressBase(BaseModel):
    problem_id: int
    attempts: int
    is_solved: bool
    proficiency: str
    time_spent: int
    last_practiced_at: datetime

class UserProgress(UserProgressBase):
    id: int

    class Config:
        orm_mode = True

class StudyStageProgress(BaseModel):
    stage: str
    total_problems: int
    solved_problems: int
    progress_percentage: float

class PaperNote(BaseModel):
    contribution: str = ""
    architecture: str = ""
    results: str = ""

class PaperBase(BaseModel):
    title: str
    url: Optional[str] = None
    type: str
    notes: Optional[PaperNote] = None
    is_read: bool = False

class PaperCreate(PaperBase):
    pass

class PaperUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    type: Optional[str] = None
    notes: Optional[PaperNote] = None
    is_read: Optional[bool] = None

class Paper(PaperBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

class GitHubCommit(BaseModel):
    sha: str
    message: str
    author: str
    date: datetime
    url: str

class UserProfile(BaseModel):
    coins: int

    class Config:
        orm_mode = True

class Achievement(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    condition_type: str
    condition_value: int
    unlocked_at: Optional[datetime]

    class Config:
        orm_mode = True

class RewardBase(BaseModel):
    name: str
    description: Optional[str] = None
    cost: int
    icon: str = "🎁"

class RewardCreate(RewardBase):
    pass

class Reward(RewardBase):
    id: int
    is_redeemed: bool

    class Config:
        orm_mode = True

class Redemption(BaseModel):
    id: int
    reward: Reward
    cost: int
    redeemed_at: datetime

    class Config:
        orm_mode = True


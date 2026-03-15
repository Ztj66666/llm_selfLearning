from sqlalchemy import Column, Integer, String, Boolean, Date, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    task_type = Column(String, index=True)  # 'Reading', 'Algorithm', 'Project'
    is_completed = Column(Boolean, default=False)
    note = Column(String, nullable=True)
    data = Column(Text, nullable=True)  # Store JSON data for algorithm problems

class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    difficulty = Column(String)  # Easy, Medium, Hard
    tags = Column(String)  # Comma-separated tags e.g. "Array,Recursion"
    url = Column(String, nullable=True)
    stage = Column(String, index=True) # 基础, 中阶, 进阶, 专项, 冲刺

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"))
    attempts = Column(Integer, default=0)
    is_solved = Column(Boolean, default=False)
    proficiency = Column(String, default="low") # low, medium, high
    time_spent = Column(Integer, default=0)  # in minutes
    last_practiced_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    problem = relationship("Problem")

class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    url = Column(String, nullable=True)
    type = Column(String) # classic (经典旧论文), new (本周新论文)
    notes = Column(Text, nullable=True) # JSON: { contribution, architecture, results }
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_read = Column(Boolean, default=False)

class UserProfile(Base):
    __tablename__ = "user_profile"

    id = Column(Integer, primary_key=True, index=True)
    coins = Column(Integer, default=0)
    
class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    icon = Column(String) # Emoji or URL
    condition_type = Column(String) # e.g., 'problem_count', 'paper_count', 'graph_problem_count'
    condition_value = Column(Integer)
    unlocked_at = Column(DateTime, nullable=True) # If null, locked

class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    cost = Column(Integer)
    icon = Column(String, default="🎁")
    is_redeemed = Column(Boolean, default=False) # For one-time rewards? Or maybe just keep history. Let's assume re-purchasable or just a list. 
    # Actually user wants "Custom Reward Entries", so maybe "Watch Movie", "Buy Game".
    # And "Redemption History".

class Redemption(Base):
    __tablename__ = "redemptions"

    id = Column(Integer, primary_key=True, index=True)
    reward_id = Column(Integer, ForeignKey("rewards.id"))
    cost = Column(Integer)
    redeemed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    reward = relationship("Reward")

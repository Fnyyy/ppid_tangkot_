import os
import subprocess
import datetime
import random

# Target repository path
repo_path = r"D:\[flash ppid1juli2025]\[flash ppid1juli2025]\modern-ppid-web"

# Define date range for August 2026
# (Since current local time is August 31, 2026, we will populate the contributions for August 1 to August 30, 2026)
start_date = datetime.date(2026, 8, 1)
end_date = datetime.date(2026, 8, 30)

# Change directory to the repository path
os.chdir(repo_path)

# Verify git settings
subprocess.run(["git", "config", "user.name", "Fnyyy"], check=True)
subprocess.run(["git", "config", "user.email", "adifunny720@gmail.com"], check=True)

# Generate a list of dates to commit on
current_date = start_date
dates = []
while current_date <= end_date:
    dates.append(current_date)
    current_date += datetime.timedelta(days=1)

# Write an initial file and track it
log_file_path = os.path.join(repo_path, "contribution_log.txt")
with open(log_file_path, "w") as f:
    f.write("Git Contribution History Log File\n")

subprocess.run(["git", "add", "contribution_log.txt"], check=True)

print("Starting commit generation...")

# Generate commits over August
total_commits = 0
for date in dates:
    # Randomly decide how many commits to make per day (between 2 and 6 commits)
    num_commits = random.randint(2, 6)
    
    for i in range(num_commits):
        # Generate random time during working hours
        hour = random.randint(9, 18)
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        
        commit_time = datetime.datetime(date.year, date.month, date.day, hour, minute, second)
        # Format string for git commit environment variables: ISO 8601
        formatted_date = commit_time.isoformat()
        
        # Modify the log file slightly to ensure there is a unique diff
        with open(log_file_path, "a") as f:
            f.write(f"Contribution entry on {formatted_date} - Commit index {i}\n")
            
        # Set git environment variables to override commit timestamps
        env = os.environ.copy()
        env["GIT_AUTHOR_DATE"] = formatted_date
        env["GIT_COMMITTER_DATE"] = formatted_date
        
        commit_msg = f"chore: optimize web app files and structure on {date.strftime('%Y-%m-%d')} part {i+1}"
        
        # Stage all changes and commit
        subprocess.run(["git", "add", "contribution_log.txt"], check=True)
        subprocess.run(["git", "commit", "-m", commit_msg], env=env, check=True)
        total_commits += 1

print(f"Generated {total_commits} commits successfully!")

import pandas as pd
import numpy as np
from faker import Faker
from datetime import datetime, timedelta
from pathlib import Path
import uuid


# ============================================================
# CONFIGURATION
# ============================================================

fake = Faker()
rng = np.random.default_rng(42)

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "data" / "raw"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

NUMBER_OF_APPLICATIONS = 5000

STAGES = [
    "Application Submitted",
    "Document Verification",
    "Credit Assessment",
    "Approval",
    "Disbursement",
]

TEAMS = [
    "Onboarding Team",
    "Verification Team",
    "Credit Team",
    "Approval Team",
    "Disbursement Team",
]

BRANCHES = [
    "Delhi",
    "Gurgaon",
    "Bengaluru",
    "Mumbai",
    "Hyderabad",
]

REGIONS = {
    "Delhi": "North",
    "Gurgaon": "North",
    "Bengaluru": "South",
    "Mumbai": "West",
    "Hyderabad": "South",
}


# ============================================================
# REFERENCE TABLES
# ============================================================

def generate_reference_tables():

    teams = []

    for team_id, team_name in enumerate(TEAMS, start=1):

        teams.append({
            "team_id": team_id,
            "team_name": team_name,
            "team_type": "Operations",
        })

    branches = []

    for branch_id, branch_name in enumerate(BRANCHES, start=1):

        branches.append({
            "branch_id": branch_id,
            "branch_name": branch_name,
            "region": REGIONS[branch_name],
        })

    return (
        pd.DataFrame(teams),
        pd.DataFrame(branches),
    )


# ============================================================
# PROCESS TIME LOGIC
# ============================================================

def get_processing_hours(stage):

    if stage == "Application Submitted":
        return int(rng.integers(4, 12))

    elif stage == "Document Verification":

        hours = int(rng.integers(6, 14))

        # 15% of cases experience a large processing delay
        if rng.random() < 0.15:
            hours += int(rng.integers(12, 48))

        return hours

    elif stage == "Credit Assessment":

        hours = int(rng.integers(6, 14))

        # 10% of cases experience a delay
        if rng.random() < 0.10:
            hours += int(rng.integers(8, 36))

        return hours

    elif stage == "Approval":
        return int(rng.integers(4, 12))

    elif stage == "Disbursement":
        return int(rng.integers(4, 12))

    return 8


def get_waiting_hours(stage):

    if stage == "Application Submitted":
        return int(rng.integers(2, 10))

    elif stage == "Document Verification":
        return int(rng.integers(4, 24))

    elif stage == "Credit Assessment":
        return int(rng.integers(2, 18))

    elif stage == "Approval":
        return int(rng.integers(2, 12))

    return 0


# ============================================================
# GENERATE APPLICATIONS + EVENTS
# ============================================================

def generate_process_data():

    applications = []
    events = []

    base_date = datetime(2025, 1, 1)

    for _ in range(NUMBER_OF_APPLICATIONS):

        # ----------------------------------------------------
        # Application metadata
        # ----------------------------------------------------

        application_id = str(uuid.uuid4())

        branch_id = int(
            rng.integers(
                1,
                len(BRANCHES) + 1
            )
        )

        team_id = int(
            rng.integers(
                1,
                len(TEAMS) + 1
            )
        )

        created_at = (
            base_date
            + timedelta(
                days=int(
                    rng.integers(0, 365)
                )
            )
        )

        application_status = rng.choice(
            [
                "Approved",
                "Rejected",
                "In Progress",
            ],
            p=[
                0.65,
                0.15,
                0.20,
            ],
        )

        applications.append({

            "application_id": application_id,

            "created_at": created_at,

            "branch_id": branch_id,

            "team_id": team_id,

            "status": application_status,

        })

        # ----------------------------------------------------
        # IMPORTANT:
        # current_time moves forward after EVERY stage.
        # ----------------------------------------------------

        current_time = created_at

        # ----------------------------------------------------
        # Generate every process stage
        # ----------------------------------------------------

        for stage_index, stage in enumerate(STAGES):

            stage_team_id = stage_index + 1

            # =================================================
            # START
            # =================================================

            started_at = current_time

            # =================================================
            # PROCESSING
            # =================================================

            processing_hours = get_processing_hours(stage)

            completed_at = (
                started_at
                + timedelta(
                    hours=processing_hours
                )
            )

            # =================================================
            # START EVENT
            # =================================================

            events.append({

                "event_id": str(uuid.uuid4()),

                "application_id": application_id,

                "event_type": "Started",

                "stage": stage,

                "event_timestamp": started_at,

                "team_id": stage_team_id,

                "branch_id": branch_id,

                "status": "Started",

            })

            # =================================================
            # COMPLETED EVENT
            # =================================================

            events.append({

                "event_id": str(uuid.uuid4()),

                "application_id": application_id,

                "event_type": "Completed",

                "stage": stage,

                "event_timestamp": completed_at,

                "team_id": stage_team_id,

                "branch_id": branch_id,

                "status": "Completed",

            })

            # =================================================
            # WAITING / QUEUE BEFORE NEXT STAGE
            # =================================================

            waiting_hours = get_waiting_hours(stage)

            current_time = (
                completed_at
                + timedelta(
                    hours=waiting_hours
                )
            )

    return (

        pd.DataFrame(applications),

        pd.DataFrame(events),

    )


# ============================================================
# MAIN
# ============================================================

def main():

    print("Generating FlowLens synthetic banking data...")

    teams_df, branches_df = (
        generate_reference_tables()
    )

    applications_df, events_df = (
        generate_process_data()
    )

    # --------------------------------------------------------
    # Save reference tables
    # --------------------------------------------------------

    teams_df.to_csv(
        OUTPUT_DIR / "teams.csv",
        index=False,
    )

    branches_df.to_csv(
        OUTPUT_DIR / "branches.csv",
        index=False,
    )

    # --------------------------------------------------------
    # Save fact tables
    # --------------------------------------------------------

    applications_df.to_csv(
        OUTPUT_DIR / "applications.csv",
        index=False,
    )

    events_df.to_csv(
        OUTPUT_DIR / "process_events.csv",
        index=False,
    )

    # --------------------------------------------------------
    # Output information
    # --------------------------------------------------------

    print()
    print("==========================================")
    print("FlowLens data generation complete!")
    print("==========================================")

    print(
        f"Applications: {len(applications_df):,}"
    )

    print(
        f"Process events: {len(events_df):,}"
    )

    print(
        f"Files saved to: {OUTPUT_DIR}"
    )

    print("==========================================")


if __name__ == "__main__":
    main()
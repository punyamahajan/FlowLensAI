from fastapi import FastAPI, HTTPException
from database import get_connection
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="FlowLens AI API",
    description="Operations Intelligence API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "FlowLens AI API is running"
    }


@app.get("/health")
def health():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


@app.get("/api/kpis")
def get_kpis():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT
                        stage,
                        total_cases,
                        avg_processing_hours,
                        median_processing_hours,
                        max_processing_hours,
                        sla_breaches,
                        ROUND(
                            100.0 * sla_breaches /
                            NULLIF(total_cases, 0),
                            2
                        ) AS sla_breach_rate
                    FROM public.vw_stage_kpis
                    ORDER BY sla_breaches DESC;
                """)

                rows = cur.fetchall()
                columns = [desc[0] for desc in cur.description]

                data = [
                    dict(zip(columns, row))
                    for row in rows
                ]

                return {
                    "count": len(data),
                    "data": data
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/api/bottlenecks")
def get_bottlenecks():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT *
                    FROM public.vw_bottleneck_analysis
                    ORDER BY 1;
                """)

                rows = cur.fetchall()
                columns = [desc[0] for desc in cur.description]

                data = [
                    dict(zip(columns, row))
                    for row in rows
                ]

                return {
                    "count": len(data),
                    "data": data
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/api/incidents")
def get_incidents():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT *
                    FROM public.sla_incidents
                    ORDER BY detected_at DESC;
                """)

                rows = cur.fetchall()
                columns = [desc[0] for desc in cur.description]

                data = [
                    dict(zip(columns, row))
                    for row in rows
                ]

                return {
                    "count": len(data),
                    "data": data
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/api/assistant")
def assistant(question: str):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                stage,
                total_cases,
                avg_processing_hours,
                sla_breaches
            FROM public.vw_stage_kpis
            ORDER BY sla_breaches DESC;
        """)

        rows = cur.fetchall()

        columns = [desc[0] for desc in cur.description]

        data = [
            dict(zip(columns, row))
            for row in rows
        ]

        cur.close()
        conn.close()

        if not data:
            return {
                "question": question,
                "answer": "No operational data was found.",
                "data": []
            }

        worst = max(
            data,
            key=lambda x: float(x["sla_breaches"] or 0)
        )

        return {
            "question": question,
            "answer": (
                f"The primary bottleneck is {worst['stage']}. "
                f"It has {worst['sla_breaches']} SLA breaches "
                f"and an average processing time of "
                f"{worst['avg_processing_hours']} hours."
            ),
            "data": data
        }

    except Exception as e:
        return {
            "question": question,
            "error": str(e)
        }
"""Utilities for Brasileirão session date logic and Brasília timezone."""

from datetime import date, datetime, timedelta, timezone

BRT = timezone(timedelta(hours=-3))

# day index: Sun(0) Mon(1) Tue(2) Wed(3) Thu(4) Fri(5) Sat(6)
_DAYS_TO_ADD = [2, 1, 0, 2, 1, 0, 3]


def brasilia_now() -> datetime:
    return datetime.now(BRT).replace(tzinfo=None)


def brasilia_date() -> date:
    return brasilia_now().date()


def brasilia_datetime_str() -> str:
    bt = brasilia_now()
    return bt.strftime("%d/%m/%Y às %H:%M (Brasília)")


def get_session_date() -> date:
    """
    Closing date for the current Brasileirão session.
    Sat/Sun/Mon games -> session closes Tuesday.
    Wed/Thu games -> session closes Friday.

    weekday(): Mon=0 .. Sun=6
    """
    today = brasilia_date()
    wd = today.weekday()
    # Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    days_map = {
        0: 1,  # Mon -> Tue (+1)
        1: 0,  # Tue -> Tue (+0)
        2: 2,  # Wed -> Fri (+2)
        3: 1,  # Thu -> Fri (+1)
        4: 0,  # Fri -> Fri (+0)
        5: 3,  # Sat -> Tue (+3)
        6: 2,  # Sun -> Tue (+2)
    }
    return today + timedelta(days=days_map[wd])


def format_date_key(d: date) -> str:
    return d.isoformat()

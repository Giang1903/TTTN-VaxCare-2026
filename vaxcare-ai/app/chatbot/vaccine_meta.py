from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd

_ROOT = Path(__file__).resolve().parents[2]
_META_PATH = _ROOT / "knowledge" / "vaccine_meta.csv"
_ALT = _ROOT / "knowledge" / "rules" / "vaccine_meta.csv"


@lru_cache(maxsize=1)
def _load_df() -> pd.DataFrame:
    path = _META_PATH if _META_PATH.exists() else _ALT
    if not path.exists():
        return pd.DataFrame()
    df = pd.read_csv(path)
    for col in ("annual", "mandatory_tcmr", "min_age_months", "max_age_months", "typical_doses", "vaccine_id"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def get_meta(vaccine_id: int | None) -> dict[str, Any] | None:
    if vaccine_id is None:
        return None
    df = _load_df()
    if df.empty:
        return None
    sub = df.loc[df["vaccine_id"] == int(vaccine_id)]
    if sub.empty:
        return None
    row = sub.iloc[0].to_dict()
    # normalize bools
    row["annual"] = bool(int(row["annual"])) if pd.notna(row.get("annual")) else False
    row["mandatory_tcmr"] = (
        bool(int(row["mandatory_tcmr"])) if pd.notna(row.get("mandatory_tcmr")) else False
    )
    return row


def get_meta_by_name(name: str | None) -> dict[str, Any] | None:
    if not name:
        return None
    key = name.strip().lower()
    df = _load_df()
    if df.empty:
        return None
    for _, row in df.iterrows():
        short = str(row.get("short_name") or "").lower()
        aliases = str(row.get("aliases") or "").lower()
        if key == short or key in aliases.split(",") or key in short:
            return get_meta(int(row["vaccine_id"]))
        for a in aliases.split(","):
            a = a.strip()
            if a and (a == key or a in key or key in a):
                return get_meta(int(row["vaccine_id"]))
    return None


def format_mandatory_answer(meta: dict[str, Any], vlabel: str) -> str:
    lines: list[str] = []
    name = meta.get("short_name") or vlabel
    if meta.get("annual"):
        lines.append(
            f"{name}: thường được khuyến cáo tiêm lại hàng năm "
            f"(ví dụ cúm — chủng virus thay đổi theo mùa)."
        )
    if meta.get("mandatory_tcmr"):
        lines.append(
            f"{name} nằm trong nhóm liên quan tiêm chủng mở rộng / lịch theo độ tuổi "
            f"(mức độ bắt buộc phụ thuộc quy định hiện hành và đối tượng)."
        )
    else:
        lines.append(
            f"{name} thường là vaccine khuyến cáo hoặc dịch vụ, "
            f"không phải mũi bắt buộc TCMR cốt lõi cho mọi đối tượng."
        )
    min_m = meta.get("min_age_months")
    if min_m is not None and pd.notna(min_m):
        min_m = int(min_m)
        if min_m >= 12:
            lines.append(f"Nhóm tuổi tham khảo thường từ khoảng {min_m // 12} tuổi trở lên.")
        elif min_m > 0:
            lines.append(f"Nhóm tuổi tham khảo thường từ khoảng {min_m} tháng tuổi.")
    note = str(meta.get("notes") or "").strip()
    if note:
        lines.append(f"Ghi chú: {note}.")
    lines.append(
        "Nội dung mang tính tham khảo; xác nhận lại với nhân viên y tế trước khi tiêm."
    )
    return "\n".join(lines)


def format_indication_from_meta(meta: dict[str, Any], vlabel: str, question: str) -> str:
    name = meta.get("short_name") or vlabel
    q = (question or "").lower()
    lines: list[str] = []
    min_m = meta.get("min_age_months")
    min_m = int(min_m) if min_m is not None and pd.notna(min_m) else None

    if re_search_young_old := __import__("re").search(
        r"người trẻ|người già|chỉ.*(già|trẻ)", q
    ):
        lines.append(f"Về {name}:")
        if min_m is not None and min_m >= 480:  # ~40y+
            years = min_m // 12
            lines.append(
                f"- Tài liệu / khuyến cáo thường hướng tới người khoảng {years} tuổi trở lên."
            )
            lines.append(
                "- Người trẻ khỏe mạnh thường không nằm nhóm ưu tiên thường quy."
            )
        elif min_m is not None:
            if min_m >= 12:
                lines.append(f"- Thường áp dụng từ khoảng {min_m // 12} tuổi trở lên.")
            else:
                lines.append(f"- Thường áp dụng từ khoảng {min_m} tháng tuổi.")
        else:
            lines.append("- Chỉ định phụ thuộc độ tuổi và yếu tố nguy cơ.")
    elif __import__("re").search(r"chưa tiêm|chưa từng", q):
        lines.append(
            f"Nếu chưa tiêm {name} bao giờ, có thể bắt đầu khi đủ điều kiện tuổi / chỉ định."
        )
        if min_m is not None:
            if min_m >= 12:
                lines.append(f"Mốc tuổi tham khảo thường từ khoảng {min_m // 12} tuổi.")
            else:
                lines.append(f"Mốc tuổi tham khảo thường từ khoảng {min_m} tháng.")
        lines.append("Nên khám sàng lọc tại cơ sở trước khi tiêm.")
    else:
        lines.append(
            f"Có thể xem xét tiêm {name} nếu đúng nhóm tuổi / chỉ định và không có chống chỉ định khi sàng lọc."
        )
        if min_m is not None:
            if min_m >= 12:
                lines.append(f"Nhóm tuổi tham khảo thường từ khoảng {min_m // 12} tuổi.")
            else:
                lines.append(f"Nhóm tuổi tham khảo thường từ khoảng {min_m} tháng.")
        lines.append("Bạn cho thêm độ tuổi sẽ cụ thể hơn.")

    if meta.get("annual"):
        lines.append("Vaccine này thường cần tiêm lại theo lịch hàng năm.")
    note = str(meta.get("notes") or "").strip()
    if note:
        lines.append(f"Ghi chú: {note}.")
    lines.append(
        "Nội dung mang tính tham khảo; xác nhận lại với nhân viên y tế trước khi tiêm."
    )
    return "\n".join(lines)



def format_post_vax_answer(question: str, vlabel: str | None = None) -> str:
    """Thông tin tham khảo phản ứng sau tiêm — không chẩn đoán, có dấu hiệu cần khám."""
    q = (question or "").lower()
    name = f" ({vlabel})" if vlabel else ""
    lines: list[str] = []

    lines.append(
        f"Sau tiêm chủng{name}, một số phản ứng nhẹ có thể gặp trong 1–2 ngày "
        f"(sốt nhẹ, đau/sưng tại chỗ, mệt). Đây là thông tin tham khảo chung, không phải chẩn đoán."
    )

    if re.search(r"sốt|nóng", q):
        lines.append(
            "Với sốt nhẹ: nghỉ ngơi, uống đủ nước; có thể dùng hạ sốt theo hướng dẫn "
            "của nhân viên y tế / tờ hướng dẫn sau tiêm (không tự ý dùng thuốc khi chưa được chỉ định)."
        )

    lines.append("Nên đi khám hoặc liên hệ cơ sở y tế ngay nếu có một trong các dấu hiệu:")
    lines.append("- Sốt cao (ví dụ ≥39°C) hoặc sốt kéo dài trên 24–48 giờ")
    lines.append("- Khó thở, thở rít, sưng mặt/môi, phát ban nhiều, li bì, co giật")
    lines.append("- Quấy khóc kéo dài ở trẻ nhỏ, bỏ bú, nôn nhiều")
    lines.append("- Sưng/đau tại chỗ tiêm tăng nhanh, lan rộng bất thường")

    lines.append(
        "Đây không phải cấp cứu qua chatbot. Triệu chứng nặng → đến cơ sở y tế / cấp cứu."
    )
    lines.append(
        "Nội dung mang tính tham khảo; xác nhận lại với nhân viên y tế trước khi tự xử trí."
    )
    return "\n".join(lines)



def format_dose_explain(
    rows: list[dict],
    vlabel: str,
    dose_number: int | None,
    question: str = "",
    age_months: float | None = None,
) -> str:
    """
    Giải thích mũi N / khác mũi trước — dùng chung mọi vaccine từ age_rules.
    Không hard-code DTP/HPV.
    """
    if not rows:
        return (
            f"Hiện chưa có đủ mốc rule cho {vlabel} để so sánh từng mũi. "
            "Bạn hỏi nhân viên y tế hoặc xem hướng dẫn tại cơ sở tiêm chủng."
        )

    by_dose: dict[int, list[dict]] = {}
    for r in rows:
        try:
            d = int(r.get("dose_number") or 0)
        except (TypeError, ValueError):
            continue
        if d <= 0:
            continue
        by_dose.setdefault(d, []).append(r)

    doses = sorted(by_dose.keys())
    q = (question or "").lower()
    lines: list[str] = []

    target = dose_number
    if target is None:
        m = re.search(r"mũi\s*(\d+)", q)
        if m:
            target = int(m.group(1))

    def _fmt_row(r: dict) -> str:
        age_g = (r.get("age_group") or "").strip()
        note = (r.get("note") or "").strip()
        parts = [p for p in (age_g, note) if p]
        return " — ".join(parts) if parts else "theo phác đồ tham khảo"

    if target and target in by_dose:
        lines.append(f"Với {vlabel}, mũi {target}:")
        for r in by_dose[target][:3]:
            lines.append(f"- {_fmt_row(r)}")

        # So sánh với mũi trước nếu user hỏi khác / là sao
        if re.search(r"khác|so với|khác gì|khác nhau|là sao|là gì", q) or True:
            earlier = [d for d in doses if d < target]
            if earlier:
                lines.append(
                    f"Khác các mũi trước (mũi {', '.join(str(d) for d in earlier)}):"
                )
                # Mũi đầu series thường khởi đầu; mũi sau củng cố/nhắc — nêu theo dữ liệu
                first = min(doses)
                if target > first:
                    lines.append(
                        f"- Mũi {first}"
                        + (f"–{target-1}" if target - first > 1 else "")
                        + " thường là các mũi tạo / xây nền miễn dịch theo lịch cơ bản."
                    )
                    lines.append(
                        f"- Mũi {target} thường là mũi tiếp theo hoặc mũi nhắc "
                        f"để củng cố miễn dịch, gắn mốc tuổi / khoảng cách trong lịch."
                    )
                for d in earlier[:3]:
                    rs = by_dose[d]
                    if age_months is not None:
                        try:
                            am = float(age_months)
                            # Ưu tiên dòng cùng “nhóm trẻ” (age_to nhỏ hoặc gần am), tránh lịch thai phụ
                            def _score(r):
                                note = (r.get("note") or "").lower()
                                age_g = (r.get("age_group") or "").lower()
                                pen = 0
                                if "thai" in note or "thai" in age_g:
                                    pen += 50
                                try:
                                    a1 = float(r.get("age_to_months")) if r.get("age_to_months") is not None else 9999
                                except (TypeError, ValueError):
                                    a1 = 9999
                                # Ưu tiên mốc trẻ em / gần tuổi đang hỏi
                                return pen + abs(a1 - min(am, a1))
                            rs = sorted(rs, key=_score)
                        except (TypeError, ValueError):
                            pass
                    bits = [_fmt_row(r) for r in rs[:1]]
                    if bits:
                        lines.append(f"- Mũi {d}: {bits[0]}")
    else:
        lines.append(f"Với {vlabel}, các mốc mũi tham khảo:")
        for d in doses[:6]:
            bits = [_fmt_row(r) for r in by_dose[d][:2]]
            lines.append(f"- Mũi {d}: {'; '.join(bits)}" if bits else f"- Mũi {d}")

    if age_months is not None:
        try:
            am = float(age_months)
            # Các mũi trùng cửa sổ tuổi
            matched = []
            for d, rs in by_dose.items():
                for r in rs:
                    a0, a1 = r.get("age_from_months"), r.get("age_to_months")
                    try:
                        if a0 is not None and a1 is not None and float(a0) <= am <= float(a1):
                            matched.append(d)
                            break
                    except (TypeError, ValueError):
                        pass
            if matched:
                lines.append(
                    f"Với khoảng {int(am) if am == int(am) else am} tháng, "
                    f"các mũi trong cửa sổ tuổi (tham khảo): "
                    + ", ".join(f"mũi {d}" for d in sorted(set(matched))[:5])
                    + "."
                )
        except (TypeError, ValueError):
            pass

    srcs = []
    for r in rows:
        s = (r.get("source_doc") or "").strip()
        if s and s not in srcs:
            srcs.append(s)
    if srcs:
        lines.append("Nguồn: " + ", ".join(srcs[:3]) + ".")
    lines.append(
        "Nội dung mang tính tham khảo; xác nhận lại với nhân viên y tế trước khi tiêm."
    )
    return "\n".join(lines)
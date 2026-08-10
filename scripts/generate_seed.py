"""
Generate supabase/seed-rides-2026.sql from the parsed Annual Ride calendar.
Run: python scripts/generate_seed.py
"""

import re, os

# ---------------------------------------------------------------------------
# Ride definitions
# Each tuple: (title, short_description, start, end,
#              community, ride_type, chapter, priority, status, tags, description)
# ---------------------------------------------------------------------------

RIDES = [
  # ── May 2026 ─────────────────────────────────────────────────────────────
  (
    "AOG Chapter Ride - Bagmati (May)",
    "Monthly AOG chapter ride for Bagmati members.",
    "2026-05-09","2026-05-09",
    "AOG","chapter","Bagmati","chapter","completed",
    ["aog","chapter","bagmati"],
    "Regular monthly chapter ride for Apache Owners Group Bagmati chapter members."
  ),
  (
    "CULT Ride - Bagmati (May)",
    "CULT community lifestyle and exploration ride.",
    "2026-05-23","2026-05-23",
    "CULT","cult","Bagmati","chapter","completed",
    ["cult","bagmati"],
    "Monthly CULT ride focused on travel, lifestyle, and exploration for the Bagmati community."
  ),
  # ── June 2026 ────────────────────────────────────────────────────────────
  (
    "AOG Ride - Dhangadhi",
    "AOG chapter ride to Dhangadhi, far-western Nepal.",
    "2026-06-06","2026-06-06",
    "AOG","chapter","Mahakali","chapter","planned",
    ["aog","dhangadhi","far-west","mahakali"],
    "AOG community ride to Dhangadhi (Kailali district), exploring the far-western corridor with chapter members."
  ),
  (
    "AOG Ride - Lumbini & Palpa",
    "AOG chapter ride through Lumbini and Palpa.",
    "2026-06-13","2026-06-13",
    "AOG","chapter","Lumbini","chapter","planned",
    ["aog","lumbini","palpa","heritage"],
    "AOG chapter ride through the historic Lumbini province, with a route through Palpa (Tansen) hill town."
  ),
  (
    "CULT Overnight - Dhorpatan",
    "3-day CULT ride into the Dhorpatan Hunting Reserve.",
    "2026-06-26","2026-06-28",
    "CULT","overnight","Gandaki","chapter","planned",
    ["cult","dhorpatan","overnight","gandaki","nature"],
    "A 3-day CULT overnight adventure into Dhorpatan - one of Nepal's most remote and scenic destinations in Baglung district, Gandaki province. High-altitude passes, pristine trails, and wildlife."
  ),
  # ── July 2026 ────────────────────────────────────────────────────────────
  (
    "AOG Community Ride - Bheri (Kohalpur/Nepalgunj)",
    "AOG community ride in the Bheri region.",
    "2026-07-11","2026-07-11",
    "AOG","chapter","Bheri","chapter","planned",
    ["aog","bheri","kohalpur","nepalgunj","community"],
    "AOG community ride covering the Bheri chapter region - Kohalpur and Nepalgunj - bringing together riders from across the western Terai."
  ),
  (
    "CULT Ride - Ilam & Birtamode",
    "CULT eastern Nepal ride through Ilam tea estates and Birtamode.",
    "2026-07-18","2026-07-18",
    "CULT","cult","Mechi","chapter","planned",
    ["cult","ilam","birtamode","eastern","tea","mechi"],
    "CULT lifestyle ride through the lush tea estates of Ilam and the border town of Birtamode in eastern Nepal."
  ),
  (
    "AOG x CULT Overnight - Bagmati",
    "Joint AOG and CULT overnight ride in the Bagmati region.",
    "2026-07-24","2026-07-25",
    "AOGxCULT","overnight","Bagmati","national","planned",
    ["aog","cult","overnight","bagmati","joint"],
    "A collaborative overnight ride bringing together AOG and CULT riders for a two-day journey through the Bagmati province. Camping, camaraderie, and shared roads."
  ),
  # ── August 2026 ──────────────────────────────────────────────────────────
  (
    "AOG Ride - Mahendranagar",
    "AOG chapter ride to far-western Mahendranagar.",
    "2026-08-08","2026-08-08",
    "AOG","chapter","Mahakali","chapter","planned",
    ["aog","mahendranagar","far-west","sudurpashchim"],
    "AOG ride to Mahendranagar, the gateway city of Sudurpashchim province on the western border, covering the Mahakali chapter territory."
  ),
  (
    "CULT Ride - Janakpur",
    "CULT cultural ride to Janakpur, the city of Mithila art.",
    "2026-08-15","2026-08-15",
    "CULT","cult","Narayani","chapter","planned",
    ["cult","janakpur","culture","mithila","madhesh"],
    "CULT lifestyle ride to Janakpur - Nepal's cultural capital of the Madhesh, famous for Mithila art, the Janaki Mandir, and its rich heritage."
  ),
  (
    "AOG Ride - Chitwan (August)",
    "AOG Narayani chapter ride through Chitwan.",
    "2026-08-22","2026-08-22",
    "AOG","chapter","Narayani","chapter","planned",
    ["aog","chitwan","narayani","jungle"],
    "AOG chapter ride through Chitwan district - home to the Chitwan National Park, Narayani river, and the thriving chapter community."
  ),
  # ── September 2026 ───────────────────────────────────────────────────────
  (
    "AOG Community Ride - Biratnagar",
    "AOG Koshi chapter community ride in Biratnagar.",
    "2026-09-05","2026-09-05",
    "AOG","chapter","Koshi","chapter","planned",
    ["aog","biratnagar","koshi","eastern","community"],
    "AOG community ride in Biratnagar, the industrial capital of eastern Nepal and home of the Koshi chapter."
  ),
  (
    "Mustang Biking Festival - AOG x CULT Marquee 2026",
    "The crown jewel of 2026 - 7-day marquee expedition to Upper Mustang.",
    "2026-09-15","2026-09-21",
    "AOGxCULT","marquee","Gandaki","marquee","confirmed",
    ["marquee","mustang","expedition","festival","gandaki","high-altitude","aog","cult"],
    "The flagship AOG x CULT marquee expedition of 2026 - a 7-day biking festival through the mythical Upper Mustang. Routes cover Pokhara to Jomsom, Kagbeni, Chuksang, and Lo Manthang. Restricted area permits, Tibetan-influenced culture, high-altitude desert, and the raw beauty of the Forbidden Kingdom. The premier riding event of the year."
  ),
  # ── October 2026 ─────────────────────────────────────────────────────────
  (
    "AOG Chapter Ride - Bagmati (October)",
    "Monthly AOG Bagmati chapter ride for October.",
    "2026-10-10","2026-10-10",
    "AOG","chapter","Bagmati","chapter","planned",
    ["aog","bagmati","chapter","october"],
    "Monthly AOG chapter ride for Bagmati members during the post-monsoon season - clear skies, smooth roads, and peak riding weather."
  ),
  (
    "Ride Back Home with TVS - National",
    "National multi-city ride: Kathmandu to Birtamode, Chitwan, and Nepalgunj simultaneously.",
    "2026-10-17","2026-10-18",
    "AOGxCULT","overnight","Bagmati","national","planned",
    ["tvs","national","multi-city","dashain","birtamode","chitwan","nepalgunj"],
    "A landmark TVS Nepal national event running simultaneously across three corridors: Kathmandu to Birtamode (East), Kathmandu to Chitwan, and Kathmandu to Nepalgunj (via Pokhara/Butwal). Hundreds of TVS riders across AOG and CULT communities riding home for the festive season."
  ),
  (
    "AOG x CULT Ride - October (TBD)",
    "Potential joint AOG and CULT ride - date to be confirmed.",
    "2026-10-31","2026-10-31",
    "AOGxCULT","chapter","Bagmati","chapter","tentative",
    ["aog","cult","tentative","october"],
    "A possible joint AOG x CULT ride planned for end of October. Details and location to be confirmed based on feasibility and chapter availability."
  ),
  # ── December 2026 ────────────────────────────────────────────────────────
  (
    "Motosoul Marquee - Kathmandu to Goa",
    "Epic 15-day AOG x CULT marquee ride from Kathmandu to Goa, India.",
    "2026-12-01","2026-12-15",
    "AOGxCULT","marquee","Bagmati","marquee","planned",
    ["marquee","motosoul","kathmandu","goa","india","international","15-day"],
    "Motosoul - the most ambitious AOG x CULT marquee ride to date. A 15-day cross-border expedition from Kathmandu to Goa, covering thousands of kilometres through Nepal and India. This is the ultimate TVS Nepal riding event of 2026: an international marquee journey celebrating motorcycle culture, brotherhood, and the open road. Preparation begins mid-November with community induction rides."
  ),
  (
    "AOG x CULT Christmas CSR Ride - Bagmati",
    "Christmas-themed community service ride in Bagmati.",
    "2026-12-25","2026-12-25",
    "AOGxCULT","chapter","Bagmati","chapter","planned",
    ["aog","cult","christmas","csr","bagmati","community-service"],
    "A special Christmas-themed CSR (Community Service) ride bringing together AOG and CULT riders in Bagmati for a day of giving back to the community while celebrating the festive season on two wheels."
  ),
  # ── January 2027 ─────────────────────────────────────────────────────────
  (
    "CULT Ride - Pokhara (January 2027)",
    "CULT lifestyle and exploration ride to Pokhara.",
    "2027-01-09","2027-01-09",
    "CULT","cult","Gandaki","chapter","planned",
    ["cult","pokhara","gandaki","lakeside","lifestyle"],
    "CULT ride to Pokhara - Nepal's tourism capital nestled beside Phewa Lake with views of the Annapurna range. A perfect winter CULT destination ride."
  ),
  (
    "AOG Chapter Ride - Lumbini (January 2027)",
    "AOG Lumbini chapter ride for January.",
    "2027-01-16","2027-01-16",
    "AOG","chapter","Lumbini","chapter","planned",
    ["aog","lumbini","chapter","january"],
    "AOG monthly chapter ride covering the Lumbini province, with routes through the spiritual and cultural heartland of western Nepal."
  ),
  (
    "AOG x CULT Overnight Carnival - Multi-City",
    "Joint overnight carnival across Pokhara, Chitwan, and Kathmandu.",
    "2027-01-22","2027-01-23",
    "AOGxCULT","overnight","Bagmati","national","planned",
    ["aog","cult","overnight","carnival","pokhara","chitwan","kathmandu","multi-city"],
    "A joint AOG x CULT overnight carnival event running simultaneously across three major cities - Pokhara, Chitwan, and Kathmandu. A celebration of the riding community with overnight stays, group activities, and chapter meetups."
  ),
  (
    "AOG Ride - Birgunj",
    "AOG central region chapter ride to Birgunj.",
    "2027-01-30","2027-01-30",
    "AOG","chapter","Narayani","chapter","planned",
    ["aog","birgunj","narayani","central","terai"],
    "AOG chapter ride to Birgunj - the major trade city on the Nepal-India border in Narayani province, connecting central Nepal chapters."
  ),
  # ── February 2027 ────────────────────────────────────────────────────────
  (
    "AOG CSR Ride (February 2027)",
    "AOG community service and social responsibility ride.",
    "2027-02-13","2027-02-13",
    "AOG","chapter","Bagmati","local","planned",
    ["aog","csr","community-service","social"],
    "Annual AOG CSR (Community Service Responsibility) ride - riders come together to give back through social initiatives, raising awareness and contributing to communities along the route."
  ),
  (
    "AOG x CULT Chapter Ride - Surkhet",
    "Joint AOG and CULT chapter ride to Surkhet, Karnali.",
    "2027-02-20","2027-02-20",
    "AOGxCULT","chapter","Bheri","chapter","planned",
    ["aog","cult","surkhet","karnali","bheri","chapter"],
    "Joint AOG x CULT chapter ride to Surkhet - the emerging hub of Karnali province. Riders from across the Bheri region join for a collaborative chapter event."
  ),
  (
    "CULT Ride - Mechi (February 2027)",
    "CULT eastern border ride in the Mechi chapter region.",
    "2027-02-27","2027-02-27",
    "CULT","cult","Mechi","chapter","planned",
    ["cult","mechi","eastern","border","koshi"],
    "CULT lifestyle ride through the Mechi chapter area - the eastern tip of Nepal bordering India's West Bengal, with lush forests, tea gardens, and the Mechi river."
  ),
  # ── March 2027 ───────────────────────────────────────────────────────────
  (
    "AOG Chapter Ride - Chitwan (March 2027)",
    "AOG Narayani chapter ride through Chitwan.",
    "2027-03-13","2027-03-13",
    "AOG","chapter","Narayani","chapter","planned",
    ["aog","chitwan","narayani","march"],
    "AOG chapter ride through Chitwan as spring riding season begins - perfect weather along the Narayani corridor."
  ),
  (
    "CULT Ride - Mahendranagar & Dhangadhi",
    "CULT far-western ride through Mahendranagar and Dhangadhi.",
    "2027-03-20","2027-03-20",
    "CULT","cult","Mahakali","chapter","planned",
    ["cult","mahendranagar","dhangadhi","far-west","sudurpashchim"],
    "CULT exploration ride through the far-western corridor - Mahendranagar and Dhangadhi, covering the Mahakali chapter territory along Sudurpashchim province."
  ),
  (
    "AOG x CULT Year-Close Ride - Kathmandu",
    "Year-close joint AOG x CULT overnight ride in Kathmandu.",
    "2027-03-26","2027-03-27",
    "AOGxCULT","overnight","Bagmati","national","planned",
    ["aog","cult","kathmandu","bagmati","year-close","overnight"],
    "The final joint AOG x CULT overnight ride of the season - a Kathmandu-based celebration bringing together riders from all chapters for a memorable year-close event before the new Nepali year."
  ),
]

# ---------------------------------------------------------------------------
# Slug generator
# ---------------------------------------------------------------------------

used_slugs = set()

def make_slug(title):
    s = title.lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return s[:80].strip("-")

def unique_slug(title):
    base = make_slug(title)
    slug = base
    n = 2
    while slug in used_slugs:
        slug = f"{base}-{n}"
        n += 1
    used_slugs.add(slug)
    return slug

# ---------------------------------------------------------------------------
# SQL generation
# ---------------------------------------------------------------------------

def sql_str(v):
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"

def sql_array(lst):
    items = ", ".join(f"'{x}'" for x in lst)
    return f"ARRAY[{items}]::text[]"

lines = []
lines.append("-- =============================================================================")
lines.append("-- TVS Nepal Ride Operations - 2026/2027 Annual Calendar Seed")
lines.append("-- Source: Annual Ride calendar.xlsx")
lines.append("-- Run in: Supabase Dashboard → SQL Editor")
lines.append("-- Safe to re-run: uses ON CONFLICT (slug) DO UPDATE")
lines.append("-- =============================================================================")
lines.append("")
lines.append("INSERT INTO rides (")
lines.append("  title, slug, community, ride_type, chapter,")
lines.append("  start_date, end_date, status, priority,")
lines.append("  short_description, description,")
lines.append("  expected_riders, tags,")
lines.append("  is_featured, is_recurring")
lines.append(") VALUES")

values = []
for i, ride in enumerate(RIDES):
    (title, short_desc, start, end,
     community, ride_type, chapter, priority, status,
     tags, desc) = ride

    slug = unique_slug(title)

    # Expected riders heuristics
    if ride_type == "marquee":
        exp_riders = 60
    elif ride_type == "overnight":
        exp_riders = 30
    elif priority == "national":
        exp_riders = 100
    else:
        exp_riders = 20

    is_featured = "true" if ride_type == "marquee" else "false"

    v = (
        f"  ("
        f"{sql_str(title)}, "
        f"{sql_str(slug)}, "
        f"'{community}'::community_type, "
        f"'{ride_type}'::ride_type, "
        f"'{chapter}'::chapter_name,\n"
        f"   '{start}', '{end}', "
        f"'{status}'::ride_status, "
        f"'{priority}'::ride_priority,\n"
        f"   {sql_str(short_desc)},\n"
        f"   {sql_str(desc)},\n"
        f"   {exp_riders}, "
        f"{sql_array(tags)},\n"
        f"   {is_featured}, false)"
    )
    values.append(v)

lines.append(",\n".join(values))
lines.append("")
lines.append("ON CONFLICT (slug) DO UPDATE SET")
lines.append("  title             = EXCLUDED.title,")
lines.append("  short_description = EXCLUDED.short_description,")
lines.append("  description       = EXCLUDED.description,")
lines.append("  start_date        = EXCLUDED.start_date,")
lines.append("  end_date          = EXCLUDED.end_date,")
lines.append("  status            = EXCLUDED.status,")
lines.append("  priority          = EXCLUDED.priority,")
lines.append("  community         = EXCLUDED.community,")
lines.append("  ride_type         = EXCLUDED.ride_type,")
lines.append("  chapter           = EXCLUDED.chapter,")
lines.append("  expected_riders   = EXCLUDED.expected_riders,")
lines.append("  tags              = EXCLUDED.tags,")
lines.append("  is_featured       = EXCLUDED.is_featured;")
lines.append("")
lines.append(f"-- {len(RIDES)} rides inserted/updated")

sql = "\n".join(lines)

out_path = r"D:\TVS Calendar\tvscalendar\supabase\seed-rides-2026.sql"
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    f.write(sql)

print(f"Written {len(RIDES)} rides to {out_path}")
print("\nSlug preview:")
used_slugs.clear()
for r in RIDES:
    print(f"  {unique_slug(r[0])}")

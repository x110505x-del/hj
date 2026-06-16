import json
import re

with open("/Users/hyeon-sookchoi/.gemini/antigravity/brain/09071046-908b-4bfa-b040-4ce9284e0f8c/scratch/table_raw.json", "r", encoding="utf-8") as f:
    table = json.load(f)

# Standard Kangxi sounds for the 214 radicals
sounds = [
    "일", "곤", "주", "별", "을", "궐",
    "이", "해", "인", "인", "입", "팔", "경", "멱", "빙", "궤", "감", "도", "력", "포", "비", "희", "혜", "십", "복", "절", "한", "사", "우",
    "구", "국", "토", "사", "치", "쇠", "석", "대", "녀", "자", "면", "촌", "소", "왕", "시", "초", "산", "천", "공", "기", "건", "간", "요", "엄", "인", "공", "익", "궁", "계", "삼", "척",
    "심", "과", "호", "수", "지", "문", "문", "두", "근", "방", "기", "일", "왈", "월", "목", "흠", "지", "사", "수", "무", "비", "모", "씨", "기", "수", "화", "조", "부", "효", "장", "편", "아", "우", "견",
    "현", "옥", "과", "와", "감", "생", "용", "전", "필", "질", "발", "백", "피", "명", "목", "모", "시", "석", "시", "유", "화", "혈", "립",
    "죽", "미", "사", "부", "망", "양", "우", "로", "이", "뢰", "이", "율", "육", "신", "자", "지", "구", "설", "천", "주", "간", "색", "초", "호", "충", "혈", "행", "의", "아",
    "견", "각", "언", "곡", "두", "시", "치", "패", "적", "주", "족", "신", "차", "신", "진", "착", "읍", "유", "변", "리",
    "금", "장", "문", "부", "이", "추", "우", "청", "비",
    "면", "혁", "위", "구", "음", "혈", "풍", "비", "식", "수", "향",
    "마", "골", "고", "발", "투", "창", "력", "귀", "어", "조",
    "로", "록", "맥", "마", "황", "서",
    "흑", "치", "맹", "정",
    "고", "서", "비", "제",
    "치", "룡", "귀", "약"
]

def get_stroke_count(index):
    # index is 1-based (1 to 214)
    if index <= 6: return 1
    elif index <= 29: return 2
    elif index <= 60: return 3
    elif index <= 94: return 4
    elif index <= 117: return 5
    elif index <= 146: return 6
    elif index <= 166: return 7
    elif index <= 175: return 8
    elif index <= 186: return 9
    elif index <= 196: return 10
    elif index <= 202: return 11
    elif index <= 206: return 12
    elif index <= 208: return 13
    elif index <= 210: return 14
    elif index == 211: return 15
    elif index in (212, 213): return 16
    elif index == 214: return 17
    return 1

pairs = []
for i in range(0, len(table), 2):
    char_row = table[i]
    mean_row = table[i+1]
    for col in range(len(char_row)):
        char = char_row[col]
        mean = mean_row[col]
        if char is not None and mean is not None:
            char = char.replace("\n", "").strip()
            mean = mean.replace("\n", "").strip()
            mean = re.sub(r'[\uf000-\uffff]', '', mean)
            mean = mean.replace("", "").strip()
            mean = re.sub(r'^[①-⑨]', '', mean)
            if char or mean:
                pairs.append((char, mean))

radicals = []
for idx, (c, m) in enumerate(pairs):
    num = idx + 1
    std_sound = sounds[idx]
    
    # Split meaning and sound
    # If the PDF meaning ends with standard sound, split them.
    # Otherwise, meaning is the pdf name, and sound is the standard sound.
    if len(m) > 1 and m.endswith(std_sound):
        meaning = m[:-len(std_sound)].strip()
        sound = std_sound
    else:
        meaning = m
        sound = std_sound
        
    strokes = get_stroke_count(num)
    
    radicals.append({
        "id": f"r_{num}",
        "char": c,
        "meaning": meaning,
        "sound": sound,
        "fullMeaning": f"{meaning} {sound}",
        "strokes": strokes,
        "example": f"{c} ({meaning} {sound})"
    })

# Write the radicals database file
db_path = "/Users/hyeon-sookchoi/Desktop/hj/src/services/radicalDb.js"

with open(db_path, "w", encoding="utf-8") as f:
    f.write("// Hanja Radicals Database (214 characters)\n")
    f.write("// Reference: 한자부수214자.pdf\n\n")
    f.write("export const RADICALS_DATA = ")
    json.dump(radicals, f, ensure_ascii=False, indent=2)
    f.write(";\n\n")
    f.write("""export function getRadicalsByStrokes(strokeCount) {
  if (strokeCount === 'all') return RADICALS_DATA;
  const num = parseInt(strokeCount, 10);
  return RADICALS_DATA.filter(r => r.strokes === num);
}
""")

print(f"Successfully generated database at {db_path} with {len(radicals)} radicals.")
print("Radical 1:", radicals[0])
print("Radical 214:", radicals[-1])

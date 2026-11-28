// Canonical 58-exercise catalog
export const EXERCISES = [
  {
    "id": "home_smr",
    "mode": "home",
    "category": "웜업·이완",
    "presets": [
      "all",
      "warmup",
      "riding_recovery"
    ],
    "name": "폼롤러 등 상부·광배근 이완 (SMR)",
    "equipment": "폼롤러",
    "targetMuscle": "흉추(등 상부)·광배근·능형근",
    "defaultWeightKg": null,
    "defaultSets": 2,
    "defaultReps": "45초",
    "restSec": 20,
    "pairName": "스트레칭 존 매트 이완",
    "prep": "매트에 무릎을 세우고 누워 날개뼈 아래(등 상부)에 폼롤러를 가로로 받친 뒤 머리 뒤를 가볍게 감쌉니다.",
    "steps": [
      "날개뼈 아래 흉추 셋업: 엉덩이를 살짝 들어 등 상부에 체중을 싣고 날개뼈를 양옆으로 열어줍니다.",
      "등 상부 천천히 롤링: 15~20초간 위아래 짧은 폭으로 천천히 굴리며 뭉친 지점을 이완합니다. (요추 직접 압박 금지)",
      "겨드랑이 아래 광배근 이완: 옆으로 돌아 누워 겨드랑이 아래쪽 광배근 옆면을 롤러에 대고 좌우 각 20초씩 풀어줍니다."
    ],
    "breathing": "압박 지점에서 숨을 참지 말고 길게 내쉬며 등·어깨 힘을 뺍니다.",
    "tips": "허리(요추) 뼈를 직접 굴리지 말고 등 상부와 겨드랑이 아래 광배근에만 집중하세요."
  },
  {
    "id": "home_thoracic_rot",
    "mode": "home",
    "category": "웜업·이완",
    "presets": [
      "all",
      "warmup",
      "riding_recovery"
    ],
    "name": "네발기기 흉추 회전 스트레칭",
    "equipment": "맨몸·매트",
    "targetMuscle": "등 상부(흉추) 회전 가동성·어깨",
    "defaultWeightKg": null,
    "defaultSets": 2,
    "defaultReps": "좌우 각 10회",
    "restSec": 20,
    "pairName": "팩덱플라이 역방향 (가동성 보강)",
    "prep": "손목은 어깨 아래, 무릎은 골반 아래에 두는 네발기기 자세를 취합니다.",
    "steps": [
      "한쪽 손바닥으로 바닥을 밀고 반대쪽 손끝을 귀 뒤나 관자놀이에 댑니다.",
      "골반을 고정한 채 팔꿈치를 바닥 쪽으로 살짝 넣었다가 천장 방향으로 활짝 엽니다.",
      "정점에서 1~2초 가슴을 편 뒤 천천히 제자리로 돌아옵니다."
    ],
    "breathing": "팔꿈치를 천장으로 열 때 길게 내쉬고, 내려올 때 들이마십니다.",
    "tips": "요추가 꺾이지 않도록 복부에 가벼운 긴장을 유지해 흉추만 회전하세요."
  },
  {
    "id": "home_band_pullup",
    "mode": "home",
    "category": "상체 당기기",
    "presets": [
      "all",
      "upper_core",
      "lower_core"
    ],
    "name": "치닝디핑 밴드 풀업 (오버그립)",
    "equipment": "치닝디핑·어시스트 밴드",
    "targetMuscle": "광배근·대원근·승모근 하부",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "4회",
    "restSec": 90,
    "pairName": "하이풀리 (랫풀다운)",
    "prep": "어시스트 밴드를 발/무릎에 걸고 어깨너비보다 약간 넓게 손등이 얼굴을 향하는 오버그립으로 바를 잡습니다.",
    "steps": [
      "매달린 상태에서 어깨를 아래로 끌어내려 숄더 패킹을 완료합니다.",
      "팔꿈치를 옆구리 방향으로 강하게 당겨 쇄골이 바에 가까워지도록 올라갑니다.",
      "정점에서 1초 수축한 뒤 2~3초간 버티며 천천히 시작 위치로 내려옵니다."
    ],
    "breathing": "몸을 당겨 올릴 때 내쉬고, 내려올 때 들이마십니다.",
    "tips": "반동(키핑)이나 목을 앞으로 빼는 자세를 피하고 광배근 수축에 집중하세요."
  },
  {
    "id": "home_band_chinup",
    "mode": "home",
    "category": "상체 당기기",
    "presets": [
      "all",
      "upper_core",
      "lower_core"
    ],
    "name": "치닝디핑 밴드 친업 (언더그립)",
    "equipment": "치닝디핑·어시스트 밴드",
    "targetMuscle": "광배근 하부·이두근·전완근",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "4회",
    "restSec": 90,
    "pairName": "케이블 언더그립 랫풀다운",
    "prep": "어시스트 밴드를 걸고 어깨너비로 손바닥이 얼굴을 향하는 언더그립으로 바를 잡습니다.",
    "steps": [
      "가슴을 천장 쪽으로 살짝 열며 숄더 패킹을 잡습니다.",
      "팔꿈치를 몸통 앞쪽 아래로 끌어내리며 가슴 상단이 바에 닿는 느낌으로 당깁니다.",
      "이두와 광배근의 긴장을 유지하며 2~3초간 통제해 내려옵니다."
    ],
    "breathing": "당겨 올릴 때 내쉬고, 내려올 때 깊게 들이마십니다.",
    "tips": "팔로만 당기지 말고 팔꿈치를 골반 쪽으로 내린다는 느낌으로 등 근육을 함께 쓰세요."
  },
  {
    "id": "home_kb_row",
    "mode": "home",
    "category": "상체 당기기",
    "presets": [
      "all",
      "upper_core",
      "lower_core",
      "riding_recovery"
    ],
    "name": "14kg 케틀벨 원암 로우",
    "equipment": "14kg 케틀벨·치닝디핑 지지",
    "targetMuscle": "광배근·능형근·승모근 중부·후면 삼각근",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "좌우 각 10회",
    "restSec": 60,
    "pairName": "롱 풀 / 시티드 로우 (45kg)",
    "prep": "한 손으로 치닝디핑 프레임을 짚고 상체를 약 45도 숙여 반대손으로 14kg 케틀벨을 잡습니다.",
    "steps": [
      "척추 중립을 유지하고 허리가 말리지 않도록 복압을 세웁니다.",
      "팔꿈치를 골반 뒤쪽 주머니로 보낸다는 궤적으로 배꼽 옆까지 당깁니다.",
      "정점에서 1초 수축 후 광배근 신장을 느끼며 천천히 내립니다."
    ],
    "breathing": "케틀벨을 당길 때 내쉬고, 내릴 때 들이마십니다.",
    "tips": "몸통이 과도하게 회전하거나 어깨가 으쓱 올라가지 않도록 고정하세요."
  },
  {
    "id": "home_kb_curl",
    "mode": "home",
    "category": "상체 당기기",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "14kg 케틀벨 양손 바이셉 컬",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "상완이두근·상완근",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "12회",
    "restSec": 45,
    "pairName": "암 컬 머신 (25kg)",
    "prep": "발을 어깨너비로 벌리고 서서 양손으로 케틀벨 손잡이(혼) 양옆 기둥을 감싸 쥡니다.",
    "steps": [
      "팔꿈치를 옆구리에 밀착 고정하고 가슴을 펴 어깨 말림을 방지합니다.",
      "손목을 중립으로 유지하며 팔꿈치만 접어 쇄골 높이까지 수직으로 들어 올립니다.",
      "정점에서 강하게 수축한 뒤 반동 없이 2초간 버티며 내립니다."
    ],
    "breathing": "들어 올릴 때 내쉬고, 내릴 때 들이마십니다.",
    "tips": "상체를 뒤로 젖히는 허리 반동을 쓰지 않도록 둔근과 코어를 긴장시키세요."
  },
  {
    "id": "home_scapular_pullup",
    "mode": "home",
    "category": "상체 당기기",
    "presets": [
      "all",
      "upper_core",
      "warmup",
      "riding_recovery"
    ],
    "name": "치닝디핑 스카풀라 풀업",
    "equipment": "치닝디핑",
    "targetMuscle": "하부 승모근·전거근·견갑골 안정화",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "10회",
    "restSec": 45,
    "pairName": "하이풀리 견갑 하강 웜업",
    "prep": "치닝디핑 상단 바를 오버그립으로 잡고 팔꿈치를 완전히 편 채 매달립니다.",
    "steps": [
      "팔꿈치를 굽히지 않은 상태에서 귀와 어깨 거리를 멀리하며 날개뼈만 아래·안쪽으로 끌어내립니다.",
      "몸통이 3~5cm 올라간 정점에서 1~2초 멈춰 수축감을 느낍니다.",
      "통제하며 천천히 시작 자세로 돌아옵니다."
    ],
    "breathing": "날개뼈를 끌어내릴 때 내쉬고, 힘을 풀며 내려올 때 들이마십니다.",
    "tips": "본 세트 풀업 전 견갑골 움직임을 깨우거나 요추 감압용으로 활용하세요."
  },
  {
    "id": "home_deep_pushup",
    "mode": "home",
    "category": "상체 밀기·어깨",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "푸시업 바 딥 푸시업",
    "equipment": "푸시업 바",
    "targetMuscle": "대흉근 전반·전면 삼각근·삼두근",
    "defaultWeightKg": null,
    "defaultSets": 4,
    "defaultReps": "10회",
    "restSec": 75,
    "pairName": "벤치프레스 (40kg) / 체스트프레스 (45kg)",
    "prep": "푸시업 바를 어깨너비의 1.2~1.5배로 두고 손목 중립으로 잡아 플랭크 자세를 만듭니다.",
    "steps": [
      "날개뼈를 가볍게 모으고 팔꿈치가 몸통과 약 45도를 이루도록 굽히며 내려갑니다.",
      "가슴이 바 높이 아래로 살짝 내려갈 때까지 깊게 내려가 대흉근을 이완합니다.",
      "손바닥 전체로 바를 밀어내며 시작 자세로 복귀합니다."
    ],
    "breathing": "몸을 내릴 때 들이마시고, 밀어 올릴 때 내쉽니다.",
    "tips": "엉덩이가 솟거나 허리가 처지지 않도록 복부와 둔근 긴장을 유지하세요."
  },
  {
    "id": "home_pike_pushup",
    "mode": "home",
    "category": "상체 밀기·어깨",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "푸시업 바 파이크 푸시업",
    "equipment": "푸시업 바",
    "targetMuscle": "전면·측면 삼각근·삼두근·상부 가슴",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "10회",
    "restSec": 75,
    "pairName": "숄더 프레스 머신 (30kg)",
    "prep": "푸시업 바를 어깨너비로 짚고 엉덩이를 천장 쪽으로 높게 들어 역 V자(ㅅ자)를 만듭니다.",
    "steps": [
      "시선은 발끝을 향해 목과 척추를 일직선으로 맞춥니다.",
      "팔꿈치를 뒤쪽 사선 45도로 굽히며 정수리가 바 사이 앞쪽 바닥을 향하게 내려갑니다.",
      "어깨에 체중을 집중한 후 밀어 올려 역 V자 자세로 돌아옵니다."
    ],
    "breathing": "내려갈 때 들이마시고, 밀어 올라올 때 내쉽니다.",
    "tips": "팔꿈치가 좌우로 과하게 벌어지면 어깨 충돌이 생길 수 있으니 45도를 유지하세요."
  },
  {
    "id": "home_kb_halo",
    "mode": "home",
    "category": "상체 밀기·어깨",
    "presets": [
      "all",
      "upper_core",
      "warmup"
    ],
    "name": "14kg 케틀벨 헤일로",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "회전근개·삼각근 전체·상부 승모·코어",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "8회",
    "restSec": 45,
    "pairName": "팩덱플라이 / 어깨 안정화",
    "prep": "발을 어깨너비로 벌리고 서서 14kg 케틀벨 뿔 양옆을 잡고 가슴 앞에 위치시킵니다.",
    "steps": [
      "복부와 엉덩이에 힘을 주어 몸통과 머리가 흔들리지 않게 고정합니다.",
      "한쪽 귀 옆을 스쳐 뒤통수로 넘긴 뒤 반대쪽 귀 옆을 지나 가슴 앞으로 원을 그립니다.",
      "시계 방향과 반시계 방향을 번갈아 통제된 속도로 회전합니다."
    ],
    "breathing": "원을 그리는 동안 멈추지 않고 일정하게 호흡합니다.",
    "tips": "고개를 숙이지 말고 머리를 고정한 채 케틀벨만 머리 둘레로 회전시키세요."
  },
  {
    "id": "home_kb_press",
    "mode": "home",
    "category": "상체 밀기·어깨",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "14kg 케틀벨 양손 숄더 프레스",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "전면·측면 삼각근·삼두근·상부 가슴",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "10회",
    "restSec": 60,
    "pairName": "숄더 프레스 머신 (30kg)",
    "prep": "케틀벨 손잡이 양옆을 손바닥으로 강하게 조여 쥐고(Crush Grip) 쇄골 높이에 세웁니다.",
    "steps": [
      "엉덩이와 복부를 단단히 조여 척추 중립을 유지합니다.",
      "팔꿈치가 벌어지지 않게 주의하며 정수리 위 수직 방향으로 끝까지 밀어 올립니다.",
      "2초간 통제하며 버티는 느낌으로 쇄골 앞 시작 자세로 내립니다."
    ],
    "breathing": "머리 위로 밀어 올릴 때 내쉬고, 내릴 때 들이마십니다.",
    "tips": "갈비뼈가 들리거나 허리가 뒤로 젖혀지지 않도록 복압을 강하게 잠그세요."
  },
  {
    "id": "home_kb_floor_1arm",
    "mode": "home",
    "category": "상체 밀기·어깨",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "14kg 케틀벨 원암 플로어 프레스",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "대흉근·전면 삼각근·삼두근",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "좌우 각 10회",
    "restSec": 45,
    "pairName": "벤치프레스 (40kg) / 체스트프레스 (45kg)",
    "prep": "바닥에 등을 대고 누워 무릎을 세우고 케틀벨 몸통이 손목 바깥 전완근 위에 얹히게 쥡니다.",
    "steps": [
      "위팔과 팔꿈치가 바닥에 닿은 상태에서 날개뼈를 바닥에 단단히 고정합니다.",
      "가슴과 삼두근 힘으로 케틀벨을 천장 방향으로 수직으로 끝까지 밀어 올립니다.",
      "정점에서 1초 멈춘 뒤 2초간 천천히 통제하며 팔꿈치가 바닥에 가볍게 닿게 내립니다."
    ],
    "breathing": "밀어 올릴 때 내쉬고, 내릴 때 들이마십니다.",
    "tips": "바닥에 팔꿈치가 쿵 부딪히지 않게 내리는 속도를 제어하세요."
  },
  {
    "id": "home_kb_floor_2arm",
    "mode": "home",
    "category": "상체 밀기·어깨",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "14kg 케틀벨 양손 플로어 프레스",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "대흉근 중앙·삼두근·전면 삼각근",
    "defaultWeightKg": 14,
    "defaultSets": 4,
    "defaultReps": "12회",
    "restSec": 45,
    "pairName": "벤치프레스 (40kg) / 팩덱플라이 (30kg)",
    "prep": "바닥에 누워 무릎을 세우고 양손으로 14kg 케틀벨 손잡이 양옆 기둥을 감싸 쥐고 가슴 위에 둡니다.",
    "steps": [
      "날개뼈를 고정하고 팔꿈치를 약 45도로 굽혀 바닥에 가볍게 닿을 때까지 내립니다.",
      "양손으로 손잡이를 안쪽으로 조이면서 천장 방향으로 수직으로 밀어 올립니다.",
      "정점에서 가슴 안쪽 수축을 1초 느낀 뒤 2초간 통제하며 내립니다."
    ],
    "breathing": "밀어 올릴 때 내쉬고, 내릴 때 들이마십니다.",
    "tips": "원암이 무거울 때 양손으로 분산해 관절 부담을 줄이며 가슴 자극에 집중할 수 있습니다."
  },
  {
    "id": "home_close_pushup",
    "mode": "home",
    "category": "상체 밀기·어깨",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "푸시업 바 클로즈 그립 푸시업",
    "equipment": "푸시업 바",
    "targetMuscle": "상완삼두근·대흉근 안쪽·전면 삼각근",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "12회",
    "restSec": 75,
    "pairName": "팩덱플라이 정방향 (30kg)",
    "prep": "푸시업 바 두 개를 가슴 중앙 폭(약 20~25cm)으로 나란히 두고 플랭크 자세를 취합니다.",
    "steps": [
      "팔꿈치가 몸통 옆구리를 스치듯 뒤쪽으로 접히며 가슴이 바 사이로 내려갑니다.",
      "가슴이 바 높이에 닿기 직전까지 깊게 내려간 뒤 강하게 밀어 올립니다."
    ],
    "breathing": "내려갈 때 들이마시고, 밀어 올릴 때 내쉽니다.",
    "tips": "무릎이나 정강이가 바닥에 닿지 않도록 복압과 둔근에 힘을 유지하세요."
  },
  {
    "id": "home_goblet_squat",
    "mode": "home",
    "category": "하체·파워",
    "presets": [
      "all",
      "lower_core"
    ],
    "name": "14kg 케틀벨 고블릿 스쿼트",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "대퇴사두근·대둔근·내전근·코어",
    "defaultWeightKg": 14,
    "defaultSets": 4,
    "defaultReps": "10회",
    "restSec": 60,
    "pairName": "레그프레스 (105kg)",
    "prep": "발을 어깨너비보다 넓게 벌리고 발끝을 15~30도 밖으로 둔 채 케틀벨을 가슴에 밀착합니다.",
    "steps": [
      "가슴을 펴고 코어를 잠근 채 엉덩이를 뒤로 빼며 무릎을 발끝 방향으로 굽혀 앉습니다.",
      "허벅지가 평행 이하로 내려가면 팔꿈치로 허벅지 안쪽을 살짝 밀어냅니다.",
      "발바닥 전체로 지면을 강하게 밀어내며 수직으로 일어납니다."
    ],
    "breathing": "깊게 앉을 때 들이마시고, 일어날 때 내쉽니다.",
    "tips": "무릎이 안쪽으로 모이지 않게 통제하고 상체가 과하게 숙여지지 않도록 하세요."
  },
  {
    "id": "home_bulgarian",
    "mode": "home",
    "category": "하체·파워",
    "presets": [
      "all",
      "lower_core"
    ],
    "name": "14kg 케틀벨 불가리안 스플릿 스쿼트",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "대퇴사두근·대둔근·햄스트링·고관절 안정근",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "좌우 각 10회",
    "restSec": 60,
    "pairName": "레그 익스텐션 (40kg) / 인어 사이 (45kg)",
    "prep": "지지대에서 한 걸음 반 앞에 서서 한쪽 발등을 뒤쪽 지지대에 올려놓습니다.",
    "steps": [
      "상체를 살짝 앞으로 기울인 채 앞다리 무릎을 굽혀 수직으로 앉습니다. (앞발 체중 80~85%)",
      "앞허벅지가 바닥과 평행해지면 앞발 뒤꿈치로 차올리듯 일어납니다."
    ],
    "breathing": "내려갈 때 들이마시고, 올라올 때 내쉽니다.",
    "tips": "앞다리 무릎이 두 번째 발가락 방향과 일직선을 유지하도록 집중하세요."
  },
  {
    "id": "home_kickstand_rdl",
    "mode": "home",
    "category": "하체·파워",
    "presets": [
      "all",
      "lower_core"
    ],
    "name": "14kg 케틀벨 킥스탠드 RDL",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "햄스트링·대둔근·척추기립근",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "좌우 각 12회",
    "restSec": 60,
    "pairName": "레그컬 - 라잉 타입 (37.5kg)",
    "prep": "앞발에 체중 85%를 싣고 반대발은 한 뼘 뒤로 빼 발가락 끝만 대어 균형을 잡습니다.",
    "steps": [
      "앞다리 무릎을 살짝 굽혀 고정하고 엉덩이를 뒤로 길게 빼며(Hip Hinge) 상체를 숙입니다.",
      "케틀벨이 정강이 중간까지 내려가며 앞다리 햄스트링이 늘어나는 자극을 확인합니다.",
      "엉덩이를 앞으로 밀어 넣는 힘으로 상체를 세워 복귀합니다."
    ],
    "breathing": "힙힌지 시 들이마시고, 상체를 세울 때 내쉽니다.",
    "tips": "허리가 둥글게 말리지 않도록 가슴을 열고 보조 발로 밀지 마세요."
  },
  {
    "id": "home_kb_swing",
    "mode": "home",
    "category": "하체·파워",
    "presets": [
      "all",
      "lower_core"
    ],
    "name": "14kg 케틀벨 양손 스윙",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "대둔근·햄스트링·코어·심폐 지구력",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "15회",
    "restSec": 60,
    "pairName": "레그컬 + 심폐 컨디셔닝",
    "prep": "발을 어깨너비보다 넓게 벌리고 양손으로 케틀벨 손잡이를 잡습니다.",
    "steps": [
      "힙힌지로 케틀벨을 허벅지 안쪽 뒤편으로 깊숙이 당겨 넣습니다(Backswing).",
      "둔근과 햄스트링을 폭발적으로 수축해 골반을 정면으로 튕겨 케틀벨을 가슴 높이까지 띄웁니다.",
      "낙하하는 중력을 받아 다시 가랑이 사이로 힌지하며 리드미컬하게 반복합니다."
    ],
    "breathing": "골반을 튕겨 올릴 때 짧고 강하게 내쉬고, 내려올 때 들이마십니다.",
    "tips": "팔 힘으로 들지 말고 엉덩이 탄력을 이용하며, 정점에서 허리가 과신전되지 않게 잠그세요."
  },
  {
    "id": "home_hanging_knee",
    "mode": "home",
    "category": "코어·마무리",
    "presets": [
      "all",
      "upper_core",
      "lower_core"
    ],
    "name": "치닝디핑 행잉 니레이즈",
    "equipment": "치닝디핑",
    "targetMuscle": "복직근 하부·장요근·악력",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "12회",
    "restSec": 45,
    "pairName": "플랭크 (코어 집중)",
    "prep": "치닝디핑 바를 어깨너비로 잡고 숄더 패킹한 상태로 매달립니다.",
    "steps": [
      "반동을 억제하고 아랫배 힘으로 골반을 말아 올리며 무릎을 가슴 높이까지 들어 올립니다.",
      "정점에서 1초 멈춘 뒤 다리가 툭 떨어지지 않게 통제하며 천천히 내립니다."
    ],
    "breathing": "무릎을 올릴 때 내쉬고, 내릴 때 들이마십니다.",
    "tips": "몸이 흔들리면 내리는 템포를 더 느리게 조절하세요."
  },
  {
    "id": "home_forearm_plank",
    "mode": "home",
    "category": "코어·마무리",
    "presets": [
      "all",
      "upper_core",
      "lower_core",
      "riding_recovery"
    ],
    "name": "포어암 플랭크",
    "equipment": "맨몸·매트",
    "targetMuscle": "복횡근(심부 코어)·복직근·어깨 안정근",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "50초",
    "restSec": 45,
    "pairName": "플랭크 (매트 엘보우 플랭크)",
    "prep": "매트 위에서 팔꿈치를 어깨 수직 아래에 두고 발끝을 세워 머리부터 발뒤꿈치까지 일직선을 만듭니다.",
    "steps": [
      "팔꿈치로 바닥을 밀어 날개뼈가 모이지 않게 유지합니다.",
      "배꼽을 척추 쪽으로 당기고 엉덩이를 가볍게 조여 허리 꺾임을 막습니다.",
      "호흡을 멈추지 않고 50초간 흔들림 없이 코어 복압을 유지합니다."
    ],
    "breathing": "숨을 참지 말고 짧고 규칙적인 호흡을 이어갑니다.",
    "tips": "허리가 아래로 처지면 엉덩이를 살짝 높여 복부 긴장을 먼저 되찾으세요."
  },
  {
    "id": "home_deadbug",
    "mode": "home",
    "category": "코어·마무리",
    "presets": [
      "all",
      "upper_core",
      "lower_core",
      "riding_recovery"
    ],
    "name": "데드버그 (허리 밀착 코어)",
    "equipment": "맨몸·매트",
    "targetMuscle": "복횡근·복직근 하부·요추 안정화",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "12회",
    "restSec": 45,
    "pairName": "매트 코어 안정화",
    "prep": "매트에 천장을 보고 누워 양팔은 수직으로 뻗고, 무릎과 고관절을 90도로 들어 올립니다.",
    "steps": [
      "배꼽을 바닥으로 눌러 허리와 매트 사이 빈틈을 완전히 밀착합니다.",
      "허리가 뜨지 않는 범위에서 오른팔과 왼다리를 동시에 천천히 뻗습니다.",
      "복부 힘으로 시작 자세로 돌아온 뒤 반대쪽 팔다리를 교차로 반복합니다."
    ],
    "breathing": "팔다리를 뻗을 때 길게 내쉬며 복압을 잠그고, 돌아올 때 들이마십니다.",
    "tips": "다리를 내릴 때 허리가 바닥에서 뜨면 다리 각도를 높여 가동범위를 줄이세요."
  },
  {
    "id": "home_hip_flexor_stretch",
    "mode": "home",
    "category": "웜업·이완",
    "presets": [
      "all",
      "warmup",
      "riding_recovery"
    ],
    "name": "장요근 스트레칭",
    "equipment": "맨몸·매트",
    "targetMuscle": "고관절 장요근·대퇴직근",
    "defaultWeightKg": null,
    "defaultSets": 2,
    "defaultReps": "좌우 각 30초",
    "restSec": 20,
    "pairName": "하체 쿨다운 스트레칭",
    "prep": "매트 위에서 한쪽 무릎을 바닥에 대고 앞다리는 90도로 세운 반무릎 런지 자세를 취합니다.",
    "steps": [
      "상체를 곧게 세우고 뒤쪽 엉덩이에 가볍게 힘을 줍니다.",
      "허리를 꺾지 않은 상태에서 골반 전체를 지그시 앞으로 이동합니다.",
      "뒤쪽 서혜부(고관절 앞쪽)가 늘어나는 느낌을 느끼며 30초간 유지 후 반대쪽을 진행합니다."
    ],
    "breathing": "길고 부드럽게 내쉬며 골반 앞쪽 긴장을 풀어줍니다.",
    "tips": "상체를 뒤로 젖히면 허리에 부담이 가므로 골반만 수평으로 앞으로 미세요."
  },
  {
    "id": "home_calf_stretch",
    "mode": "home",
    "category": "웜업·이완",
    "presets": [
      "all",
      "warmup",
      "riding_recovery"
    ],
    "name": "벽 종아리 스트레칭",
    "equipment": "맨몸·벽",
    "targetMuscle": "비복근·가자미근·아킬레스건",
    "defaultWeightKg": null,
    "defaultSets": 2,
    "defaultReps": "좌우 각 30초",
    "restSec": 20,
    "pairName": "하체 쿨다운 스트레칭",
    "prep": "벽 앞에 서서 양손을 벽에 대고 한쪽 발 앞꿈치를 벽면에 대며 뒤꿈치는 바닥에 붙입니다.",
    "steps": [
      "벽에 댄 앞쪽 무릎을 곧게 편 상태로 자세를 고정합니다.",
      "발뒤꿈치가 바닥에서 뜨지 않도록 유지하며 골반과 상체를 벽 쪽으로 기울입니다.",
      "종아리 뒤쪽이 팽팽하게 늘어나는 지점에서 30초간 유지 후 반대발을 진행합니다."
    ],
    "breathing": "일정하고 깊은 호흡을 유지하며 반동 없이 정적으로 늘립니다.",
    "tips": "무릎을 살짝 구부리면 깊은 가자미근까지 이완할 수 있습니다."
  },
  {
    "id": "home_side_bend",
    "mode": "home",
    "category": "코어·마무리",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "14kg 케틀벨 스탠딩 사이드 벤드",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "외복사근·내복사근·요방형근",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "좌우 각 12회",
    "restSec": 45,
    "pairName": "코어 측면 안정화",
    "prep": "오른손으로 14kg 케틀벨을 쥐고 몸 옆에 내린 채 정면을 바라보고 섭니다.",
    "steps": [
      "골반이 빠지지 않게 고정한 상태에서 케틀벨을 든 쪽으로 상체를 천천히 기울입니다.",
      "반대쪽 옆구리 근육을 강하게 수축하는 힘으로 상체를 수직으로 세워 돌아옵니다."
    ],
    "breathing": "기울일 때 들이마시고, 세우며 내쉽니다.",
    "tips": "무릎을 굽히지 않고 서서 수행 가능하며 과도하게 깊게 꺾지 마세요."
  },
  {
    "id": "home_core_twist",
    "mode": "home",
    "category": "코어·마무리",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "14kg 케틀벨 스탠딩 코어 트위스트",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "외복사근·내복사근·복횡근·전면 삼각근",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "15회",
    "restSec": 45,
    "pairName": "코어 회전 안정화",
    "prep": "양손으로 케틀벨 양옆 손잡이를 쥐고 명치 높이에서 몸통에서 한 뼘 띄워 듭니다.",
    "steps": [
      "복부와 둔근에 힘을 주어 골반을 정면으로 고정합니다.",
      "흉추만 오른쪽으로 45도 천천히 회전했다가 정면, 이어서 왼쪽 45도로 왕복합니다."
    ],
    "breathing": "몸통을 회전할 때 길게 내쉬고, 정면으로 돌아올 때 들이마십니다.",
    "tips": "하체가 따라 돌아가지 않게 골반을 고정하고 통제된 속도로 진행하세요."
  },
  {
    "id": "gym_leg_press",
    "mode": "gym",
    "category": "하체 머신",
    "presets": [
      "all",
      "lower_core"
    ],
    "name": "레그프레스",
    "equipment": "레그프레스 머신",
    "targetMuscle": "대퇴사두근·대둔근·슬근",
    "defaultWeightKg": 105,
    "defaultSets": 4,
    "defaultReps": "10회",
    "restSec": 90,
    "pairName": "14kg 케틀벨 고블릿 스쿼트",
    "prep": "등받이와 엉덩이를 시트에 완전히 밀착하고 발판을 어깨너비로 둡니다.",
    "steps": [
      "안전바를 풀고 무릎이 가슴 쪽으로 깊게 접힐 때까지 천천히 내립니다. (엉덩이 뜨지 않게)",
      "발바닥 전체로 밀어내며 무릎을 95%까지만 펴고(논락아웃) 다시 반복합니다."
    ],
    "breathing": "내릴 때 들이마시고, 발판을 밀어낼 때 내쉽니다.",
    "tips": "상단에서 무릎을 100% 락아웃하지 말고 요추 밀착 상태를 유지하세요."
  },
  {
    "id": "gym_leg_ext",
    "mode": "gym",
    "category": "하체 머신",
    "presets": [
      "all",
      "lower_core"
    ],
    "name": "레그 익스텐션",
    "equipment": "레그 익스텐션 머신",
    "targetMuscle": "대퇴사두근(대퇴직근·내측광근 VMO)",
    "defaultWeightKg": 40,
    "defaultSets": 3,
    "defaultReps": "12회",
    "restSec": 60,
    "pairName": "14kg 케틀벨 불가리안 스플릿 스쿼트",
    "prep": "무릎 회전축을 머신 축에 맞추고 발목 패드를 정강이 하단에 둡니다.",
    "steps": [
      "발끝을 몸쪽으로 당긴 상태에서 앞허벅지 힘으로 다리를 끝까지 들어 올립니다.",
      "상단 정점에서 1초 스퀴즈한 뒤 천천히 버티며 내립니다."
    ],
    "breathing": "다리를 들어 올릴 때 내쉬고, 내릴 때 들이마십니다.",
    "tips": "상체가 뒤로 들리지 않도록 손잡이를 꽉 잡고 내측광근 자극에 집중하세요."
  },
  {
    "id": "gym_leg_curl",
    "mode": "gym",
    "category": "하체 머신",
    "presets": [
      "all",
      "lower_core"
    ],
    "name": "레그컬 (라잉 타입)",
    "equipment": "라잉 레그컬 머신",
    "targetMuscle": "햄스트링 3두(후면 허벅지)",
    "defaultWeightKg": 37.5,
    "defaultSets": 3,
    "defaultReps": "12회",
    "restSec": 60,
    "pairName": "14kg 케틀벨 킥스탠드 RDL",
    "prep": "패드 위에 엎드려 무릎을 벤치 끝 회전축에 맞추고 발목 패드를 아킬레스건 위에 둡니다.",
    "steps": [
      "치골(골반 앞쪽)을 패드에 강하게 압착해 허리 개입을 0%로 차단합니다.",
      "뒤꿈치를 엉덩이 쪽으로 감아 올린 뒤 1초 수축하고 2초간 버티며 내립니다."
    ],
    "breathing": "감아 올릴 때 내쉬고, 내릴 때 들이마십니다.",
    "tips": "올릴 때 엉덩이가 위로 솟구치지 않도록 치골 패드 압착을 유지하세요."
  },
  {
    "id": "gym_inner_thigh",
    "mode": "gym",
    "category": "하체 머신",
    "presets": [
      "all",
      "lower_core"
    ],
    "name": "인어 사이 (Inner Thigh)",
    "equipment": "인어 사이 머신",
    "targetMuscle": "고관절 내전근군·박근",
    "defaultWeightKg": 45,
    "defaultSets": 3,
    "defaultReps": "15회",
    "restSec": 60,
    "pairName": "케틀벨 스모 스쿼트 / 불가리안",
    "prep": "등받이에 허리를 붙이고 양쪽 무릎 안쪽 패드에 다리를 벌려 위치시킵니다.",
    "steps": [
      "허벅지 안쪽 근육 힘으로 양 무릎을 중앙으로 강하게 모아 조입니다.",
      "모은 상태에서 1~2초 스퀴즈한 뒤 통제하며 천천히 벌립니다."
    ],
    "breathing": "다리를 모을 때 내쉬고, 벌릴 때 들이마십니다.",
    "tips": "페달링 시 무릎 좌우 흔들림을 잡아주는 핵심 보조 운동입니다."
  },
  {
    "id": "gym_chest_press",
    "mode": "gym",
    "category": "상체 머신",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "시티드 체스트프레스",
    "equipment": "체스트프레스 머신",
    "targetMuscle": "대흉근 중·하부·전면 삼각근·삼두근",
    "defaultWeightKg": 45,
    "defaultSets": 4,
    "defaultReps": "10회",
    "restSec": 90,
    "pairName": "푸시업 바 딥 푸시업",
    "prep": "의자 높이를 손잡이가 가슴 중앙~유두 라인에 오도록 조절하고 풋레일로 안전하게 세팅합니다.",
    "steps": [
      "날개뼈를 뒤로 모으고(후인 하강) 가슴을 편 상태에서 앞으로 강하게 밀어냅니다.",
      "팔꿈치를 완전히 락아웃하지 않고 가슴 자극을 유지하며 천천히 돌아옵니다."
    ],
    "breathing": "앞으로 밀 때 내쉬고, 돌아올 때 들이마십니다.",
    "tips": "어깨가 앞으로 말려 나오지 않게 날개뼈를 등받이에 고정하세요."
  },
  {
    "id": "gym_bench_press",
    "mode": "gym",
    "category": "상체 머신",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "벤치프레스",
    "equipment": "바벨 벤치프레스 (20kg + 양쪽 각 10kg)",
    "targetMuscle": "대흉근 전체·전면 삼각근·삼두근",
    "defaultWeightKg": 40,
    "defaultSets": 4,
    "defaultReps": "10회",
    "restSec": 90,
    "pairName": "푸시업 바 딥 푸시업 / 케틀벨 플로어 프레스",
    "prep": "바벨(20kg) 양쪽에 10kg 원판씩 장착(총 40kg) 후 눈이 바 아래에 오도록 눕습니다.",
    "steps": [
      "어깨너비 1.5배로 바를 잡고 날개뼈를 후인 하강해 가슴을 아치형으로 띄웁니다.",
      "바를 명치~가슴 하단 라인으로 천천히 내린 뒤 발바닥으로 바닥을 밀며 수직으로 밀어 올립니다."
    ],
    "breathing": "바를 내릴 때 들이마시고, 밀어 올릴 때 내쉽니다.",
    "tips": "손목이 뒤로 꺾이지 않게 전완근과 수직을 유지하고 팔꿈치는 약 45~60도로 내리세요."
  },
  {
    "id": "gym_pec_deck",
    "mode": "gym",
    "category": "상체 머신",
    "presets": [
      "all",
      "upper_core",
      "riding_recovery"
    ],
    "name": "팩덱플라이 (정/역방향)",
    "equipment": "팩덱플라이 머신",
    "targetMuscle": "대흉근 내측 (역방향: 후면 삼각근)",
    "defaultWeightKg": 30,
    "defaultSets": 3,
    "defaultReps": "12회",
    "restSec": 60,
    "pairName": "클로즈 푸시업 / 흉추 회전 스트레칭",
    "prep": "정방향(30kg)은 등받이에 기대고, 역방향(25kg, 리어델트)은 가슴을 패드에 대고 손잡이를 잡습니다.",
    "steps": [
      "정방향: 팔꿈치를 살짝 굽힌 채 큰 호를 그리며 가슴 중앙으로 모아 1초 수축합니다.",
      "역방향: 어깨를 내린 상태에서 후면 삼각근 힘으로 팔을 뒤로 열어 라운드숄더를 교정합니다."
    ],
    "breathing": "모을 때(정) / 뒤로 열 때(역) 내쉬고, 돌아올 때 들이마십니다.",
    "tips": "승모근이 으쓱 올라가지 않게 어깨를 아래로 고정한 상태로 수행하세요."
  },
  {
    "id": "gym_shoulder_press",
    "mode": "gym",
    "category": "상체 머신",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "숄더 프레스 머신",
    "equipment": "숄더 프레스 머신",
    "targetMuscle": "전면·측면 삼각근·상부 승모 안정화",
    "defaultWeightKg": 30,
    "defaultSets": 3,
    "defaultReps": "10회",
    "restSec": 90,
    "pairName": "파이크 푸시업 / 14kg 케틀벨 숄더 프레스",
    "prep": "손잡이가 귀~턱 높이에 오도록 의자를 조절하고 허리를 등받이에 밀착합니다.",
    "steps": [
      "전완근을 지면과 수직으로 유지한 채 손잡이를 머리 위로 밀어 올립니다.",
      "정점에서 팔꿈치를 살짝 남겨 긴장을 유지하고 귀 높이까지 천천히 내립니다."
    ],
    "breathing": "밀어 올릴 때 내쉬고, 내릴 때 들이마십니다.",
    "tips": "허리가 등받이에서 떨어지지 않게 복압을 잡고 승모근 개입을 줄이세요."
  },
  {
    "id": "gym_high_pulley",
    "mode": "gym",
    "category": "상체 머신",
    "presets": [
      "all",
      "upper_core",
      "lower_core"
    ],
    "name": "하이풀리 (랫풀다운)",
    "equipment": "하이풀리 머신",
    "targetMuscle": "광배근 상·외측·대원근·이두근",
    "defaultWeightKg": 47.5,
    "defaultSets": 3,
    "defaultReps": "10회",
    "restSec": 90,
    "pairName": "치닝디핑 풀업 / 친업",
    "prep": "허벅지 패드에 다리를 단단히 고정하고 어깨너비보다 약간 넓게 바를 잡습니다.",
    "steps": [
      "어깨를 먼저 아래로 끌어내려(견갑 하강) 광배근에 텐션을 겁니다.",
      "가슴을 살짝 들고 바를 쇄골 상단 방향으로 수직 견인한 뒤 천천히 이완합니다."
    ],
    "breathing": "바를 아래로 당길 때 내쉬고, 올라갈 때 들이마십니다.",
    "tips": "상체를 과도하게 뒤로 눕히지 말고 광배근이 늘어나는 범위를 끝까지 활용하세요."
  },
  {
    "id": "gym_long_pull",
    "mode": "gym",
    "category": "상체 머신",
    "presets": [
      "all",
      "upper_core",
      "lower_core",
      "riding_recovery"
    ],
    "name": "롱 풀 (시티드 로우)",
    "equipment": "롱 풀 머신",
    "targetMuscle": "능형근·중하부 승모근·광배근",
    "defaultWeightKg": 45,
    "defaultSets": 3,
    "defaultReps": "10회",
    "restSec": 90,
    "pairName": "14kg 케틀벨 원암 로우",
    "prep": "발판에 발을 대고 무릎을 살짝 굽힌 채 가슴을 펴고 그립을 잡습니다.",
    "steps": [
      "상체가 앞뒤로 흔들리지 않게 고정하고 팔꿈치를 뒤로 보내 그립을 배꼽 쪽으로 당깁니다.",
      "날개뼈를 등 중앙으로 1초 모아 굽은 등을 펴준 뒤 천천히 앞으로 보냅니다."
    ],
    "breathing": "배꼽 쪽으로 당길 때 내쉬고, 앞으로 이완할 때 들이마십니다.",
    "tips": "라이딩으로 말린 흉추와 굽은 등을 교정하는 데 가장 핵심적인 기구입니다."
  },
  {
    "id": "gym_arm_curl",
    "mode": "gym",
    "category": "상체 머신",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "암 컬 머신",
    "equipment": "암 컬 머신",
    "targetMuscle": "상완이두근·전완근",
    "defaultWeightKg": 25,
    "defaultSets": 3,
    "defaultReps": "12회",
    "restSec": 60,
    "pairName": "14kg 케틀벨 양손 바이셉 컬",
    "prep": "겨드랑이를 패드 상단에 밀착하고 팔꿈치 회전축을 머신 축에 맞춥니다.",
    "steps": [
      "손목을 중립으로 유지하며 이두근 힘으로 손잡이를 어깨 쪽으로 말아 올립니다.",
      "정점에서 1초 수축 후 반동 없이 천천히 내립니다."
    ],
    "breathing": "들어 올릴 때 내쉬고, 내릴 때 들이마십니다.",
    "tips": "팔꿈치가 패드에서 떨어지지 않게 고정해 이두근을 완전 고립하세요."
  },
  {
    "id": "gym_plank",
    "mode": "gym",
    "category": "코어",
    "presets": [
      "all",
      "upper_core",
      "lower_core",
      "riding_recovery"
    ],
    "name": "매트 엘보우 플랭크",
    "equipment": "헬스장 매트",
    "targetMuscle": "복횡근·복직근·척추기립근·둔근",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "50초",
    "restSec": 45,
    "pairName": "포어암 플랭크 / 푸시업 바 하이 플랭크",
    "prep": "팔꿈치를 어깨 아래에 두고 머리부터 발뒤꿈치까지 일직선으로 세팅합니다.",
    "steps": [
      "골반을 살짝 후방경사(꼬리뼈를 안으로 말기)하고 복부와 둔근에 힘을 잠급니다.",
      "호흡을 멈추지 않고 50~60초간 흔들림 없이 버팁니다."
    ],
    "breathing": "짧고 고르게 복압을 유지하며 호흡합니다.",
    "tips": "허리가 아래로 꺾이지 않도록 엉덩이와 복부 긴장을 끝까지 유지하세요."
  },
  {
    "id": "home_smr_suboccipital",
    "mode": "home",
    "presets": [
      "all",
      "warmup",
      "riding_recovery"
    ],
    "name": "폼롤러 후두하근 도리도리 이완",
    "equipment": "폼롤러",
    "targetMuscle": "후두하근·상부 승모근·경추 정렬",
    "defaultWeightKg": null,
    "defaultSets": 2,
    "defaultReps": "45초",
    "restSec": 20,
    "pairName": "스트레칭 존 매트 이완",
    "prep": "매트에 무릎을 세우고 누워 뒤통수 바로 아래 뼈와 목이 만나는 지점에 폼롤러를 가로로 받칩니다.",
    "steps": [
      "턱을 가볍게 몸 쪽으로 당겨 목 뒷면이 길어지게 만듭니다.",
      "머리를 좌우로 30도씩 천천히 도리도리 돌리며 후두하근을 지그시 압박합니다.",
      "뭉친 지점에서 3초간 정지해 호흡한 뒤 45초 동안 부드럽게 반복합니다."
    ],
    "breathing": "고개를 돌릴 때 길게 내쉬며 목과 어깨의 힘을 완전히 뺍니다.",
    "tips": "턱을 천장으로 치켜들거나 목을 빠르게 꺾지 않도록 아주 천천히 움직이세요.",
    "category": "웜업·이완"
  },
  {
    "id": "home_smr_chest_open",
    "mode": "home",
    "presets": [
      "all",
      "warmup",
      "riding_recovery"
    ],
    "name": "폼롤러 세로 눕기 가슴 열기",
    "equipment": "폼롤러",
    "targetMuscle": "소흉근·대흉근·전면 삼각근",
    "defaultWeightKg": null,
    "defaultSets": 2,
    "defaultReps": "45초",
    "restSec": 20,
    "pairName": "스트레칭 존 매트 이완",
    "prep": "폼롤러를 세로로 두고 끝부분에 엉덩이를 댄 뒤 척추와 머리 전체가 폼롤러 위에 놓이도록 눕습니다.",
    "steps": [
      "무릎을 세워 발바닥으로 균형을 잡고 허리가 과하게 뜨지 않게 복부에 가볍게 힘을 줍니다.",
      "양팔을 옆으로 벌린 뒤 팔꿈치를 90도로 접어 W자 형태로 바닥 쪽으로 내려놓습니다.",
      "중력에 맡겨 가슴 앞쪽과 어깨 전면이 시원하게 열리는 상태로 45초간 호흡합니다."
    ],
    "breathing": "코로 깊게 들이마시며 흉곽을 넓히고, 입으로 내쉬며 팔과 어깨를 바닥에 맡깁니다.",
    "tips": "어깨가 귀 쪽으로 으쓱 올라가지 않도록 날개뼈를 아래로 내려 유지하세요.",
    "category": "웜업·이완"
  },
  {
    "id": "home_smr_glute",
    "mode": "home",
    "presets": [
      "all",
      "warmup",
      "riding_recovery"
    ],
    "name": "폼롤러 4자 둔근·이상근 이완",
    "equipment": "폼롤러",
    "targetMuscle": "대둔근·이상근·고관절 외회전근",
    "defaultWeightKg": null,
    "defaultSets": 2,
    "defaultReps": "좌우 각 45초",
    "restSec": 20,
    "pairName": "스트레칭 존 매트 이완",
    "prep": "폼롤러 위에 앉아 양손을 뒤쪽 바닥에 짚고, 한쪽 발목을 반대쪽 무릎 위에 올려 4자 다리를 만듭니다.",
    "steps": [
      "다리를 올린 쪽 엉덩이로 체중을 살짝 기울여 이상근 부위에 롤러를 맞춥니다.",
      "위아래 5cm 정도의 짧은 폭으로 천천히 굴리며 뭉친 지점을 탐색합니다.",
      "자극이 큰 부위에서 잠시 멈춰 호흡을 내쉬며 45초간 풀어준 뒤 반대쪽을 진행합니다."
    ],
    "breathing": "통증 부위에서 숨을 참지 말고 길게 내쉬며 힘을 뺍니다.",
    "tips": "꼬리뼈나 요추를 직접 누르지 말고 엉덩이 바깥쪽 근육 부위에만 체중을 실으세요.",
    "category": "웜업·이완"
  },
  {
    "id": "home_smr_thoracic",
    "mode": "home",
    "presets": [
      "all",
      "warmup",
      "riding_recovery"
    ],
    "name": "폼롤러 흉추 신전 스트레칭",
    "equipment": "폼롤러",
    "targetMuscle": "흉추 신전근·광배근·어깨 가동성",
    "defaultWeightKg": null,
    "defaultSets": 2,
    "defaultReps": "45초",
    "restSec": 20,
    "pairName": "스트레칭 존 매트 이완",
    "prep": "폼롤러를 날개뼈 하단에 가로로 대고 엉덩이는 바닥에 붙인 채 무릎을 세우고 눕습니다.",
    "steps": [
      "엉덩이가 바닥에서 뜨지 않도록 고정하고, 머리 뒤로 깍지를 끼거나 팔을 앞으로 듭니다.",
      "숨을 내쉬며 등 상부(흉추)만 폼롤러 위로 부드럽게 뒤로 넘겨 가슴을 엽니다.",
      "양팔을 머리 위로 만세 자세(Y자)로 뻗어 2~3초 머문 뒤 천천히 돌아옵니다."
    ],
    "breathing": "등을 뒤로 젖혀 가슴을 열 때 길게 내쉬고, 돌아올 때 들이마십니다.",
    "tips": "허리(요추)에 폼롤러를 대거나 과도하게 꺾지 않도록 주의하세요.",
    "category": "웜업·이완"
  },
  {
    "id": "home_dead_hang",
    "mode": "home",
    "category": "웜업·이완",
    "presets": [
      "all",
      "warmup",
      "riding_recovery"
    ],
    "name": "치닝디핑 데드행 (척추 감압·악력)",
    "equipment": "치닝디핑",
    "targetMuscle": "척추 감압·광배근·전완 악력",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "30초",
    "restSec": 45,
    "pairName": "치닝디핑 스카풀라 풀업 (연계)",
    "prep": "치닝디핑 바를 어깨보다 약간 넓게 오버핸드 그립으로 단단히 잡습니다.",
    "steps": [
      "오버그립 준비: 어깨너비로 바를 잡고 발판에서 발을 뗄 준비를 합니다.",
      "완전 감압 매달리기: 발을 떼고 온몸의 힘을 빼 척추 마디마디가 길게 늘어나도록 수동 매달리기를 유지합니다.",
      "안전한 착지: 악력이 풀리기 전 양발을 발판에 먼저 안전하게 딛고 손을 놓습니다."
    ],
    "breathing": "매달린 상태에서 편안하고 깊은 심호흡을 일정하게 유지합니다.",
    "tips": "어깨를 으쓱 올려 귀와 붙이거나 발로 반동을 주지 말고, 중력에 몸을 자연스럽게 맡기세요."
  },
  {
    "id": "home_gyro_ball",
    "mode": "home",
    "category": "상체 당기기",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "윤마이 자이로볼 전완근·악력 강화",
    "equipment": "윤마이 자이로볼",
    "targetMuscle": "전완굴근·전완신근·손목 안정근",
    "defaultWeightKg": null,
    "defaultSets": 2,
    "defaultReps": "좌우 각 45초",
    "restSec": 45,
    "pairName": "14kg 케틀벨 양손 바이셉 컬",
    "prep": "화살표 방향으로 내부 로터를 감았다가 튕겨 회전을 시작합니다.",
    "steps": [
      "로터 스타트: 태엽을 끝까지 감은 뒤 손가락으로 튕겨 초기 회전력을 생성합니다.",
      "손목 원형 스냅: 손목을 부드럽게 시계 방향으로 돌려 자이로 회전 저항을 끌어올립니다.",
      "정점 부하 유지: 강한 원심력을 버티며 전완근 전체에 일정한 텐션을 45초간 유지합니다. (좌우 교대)"
    ],
    "breathing": "팔꿈치를 몸통에 고정한 채 일정한 리듬으로 호흡을 유지합니다.",
    "tips": "손목 스트랩을 반드시 착용하세요. 팔 전체를 크게 휘두르지 말고 손목 스냅을 유지하며, 종료 시 손으로 억지로 멈추지 않고 자연 감속시키세요."
  },
  {
    "id": "home_dips",
    "mode": "home",
    "category": "상체 밀기",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "치닝디핑 밴드 딥스",
    "equipment": "치닝디핑·어시스트 밴드",
    "targetMuscle": "하부 대흉근·삼두근·전면 삼각근",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "8회",
    "restSec": 75,
    "pairName": "시티드 체스트프레스 (61kg)",
    "prep": "평행바 사이에 밴드를 걸고 무릎을 얹어 팔을 펴서 지지합니다.",
    "steps": [
      "밴드 서포트 셋업: 평행바를 단단히 잡고 밴드에 무릎을 걸어 상체를 띄웁니다.",
      "상체 경사 하강: 상체를 15~20도 앞으로 기울이며 팔꿈치가 90도가 될 때까지 내려갑니다.",
      "가슴·삼두 밀기: 손바닥으로 바를 강하게 밀어내며 팔꿈치를 펴 원위치로 올라옵니다."
    ],
    "breathing": "내려가며 천천히 들이마시고, 바를 밀어 올라올 때 힘차게 내쉽니다.",
    "tips": "어깨가 앞으로 말려 과도하게 깊이 내려가지 않도록 팔꿈치 90도 각도를 엄수하세요."
  },
  {
    "id": "home_decline_pushup",
    "mode": "home",
    "category": "상체 밀기",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "푸시업 바 디클라인 푸시업",
    "equipment": "푸시업 바",
    "targetMuscle": "상부 대흉근·전면 삼각근·삼두근",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "10회",
    "restSec": 75,
    "pairName": "인클라인 벤치프레스",
    "prep": "푸시업 바를 바닥에 어깨너비로 두고 발을 의자나 침대 위에 올립니다.",
    "steps": [
      "발 높임 셋업: 발을 의자에 올리고 푸시업 바를 잡아 하이 플랭크 자세를 잡습니다.",
      "가슴 상단 하강: 머리부터 발끝까지 일직선을 유지하며 가슴 상단이 바 높이까지 깊게 내려갑니다.",
      "쇄골 방향 밀기: 쇄골 부위를 모으듯 바닥을 밀어 몸을 곧게 올려 원위치합니다."
    ],
    "breathing": "내려가며 들이마시고, 바를 강하게 밀어 올리며 내쉽니다.",
    "tips": "엉덩이가 아래로 처져 허리가 꺾이지 않도록 복부와 둔근을 단단히 조이세요."
  },
  {
    "id": "home_kb_triceps",
    "mode": "home",
    "category": "상체 밀기",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "14kg 케틀벨 오버헤드 트라이셉스",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "상완삼두근 장두·코어",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "10회",
    "restSec": 45,
    "pairName": "케이블 트라이셉스 푸시다운",
    "prep": "케틀벨 손잡이를 양손으로 단단히 쥐고 머리 위로 수직으로 뻗습니다.",
    "steps": [
      "오버헤드 셋업: 케틀벨을 양손으로 머리 위로 들고 팔꿈치를 귀 옆에 고정합니다.",
      "팔꿈치 굴곡 하강: 팔꿈치 각도를 모은 채 케틀벨을 뒤통수 뒤로 천천히 내립니다.",
      "수직 오버헤드 신전: 삼두근 힘으로 케틀벨을 수직 위로 밀어 정수리 위에서 1초 수축합니다."
    ],
    "breathing": "케틀벨을 내릴 때 들이마시고, 머리 위로 밀어 올릴 때 내쉽니다.",
    "tips": "팔꿈치가 양옆으로 벌어지거나 허리가 활처럼 뒤로 꺾이지 않도록 코어를 잠그세요."
  },
  {
    "id": "home_kb_glute_bridge",
    "mode": "home",
    "category": "하체·파워",
    "presets": [
      "all",
      "lower_core",
      "riding_recovery"
    ],
    "name": "14kg 케틀벨 글루트 브릿지",
    "equipment": "14kg 케틀벨·매트",
    "targetMuscle": "대둔근·햄스트링·골반 안정화",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "15회",
    "restSec": 45,
    "pairName": "레그프레스 (120kg)",
    "prep": "무릎을 세우고 누워 골반 접히는 부위에 케틀벨을 얹어 양손으로 잡습니다.",
    "steps": [
      "매트 브릿지 셋업: 누운 상태에서 발을 골반 너비로 두고 케틀벨을 안전하게 고정합니다.",
      "둔근 수축 리프트: 발뒤꿈치로 매트를 강하게 밀어 무릎~어깨가 일직선이 될 때까지 엉덩이를 듭니다.",
      "정점 조임 & 통제 복귀: 엉덩이를 2초간 쥐어짠 후 닿기 직전까지 천천히 내립니다."
    ],
    "breathing": "엉덩이를 들어 올릴 때 강하게 내쉬고, 바닥으로 내릴 때 들이마십니다.",
    "tips": "허리를 과도하게 꺾어 들지 말고 오직 둔근과 햄스트링 힘으로 골반을 밀어 올리세요."
  },
  {
    "id": "home_kb_suitcase_carry",
    "mode": "home",
    "category": "코어·마무리",
    "presets": [
      "all",
      "upper_core",
      "lower_core",
      "riding_recovery"
    ],
    "name": "14kg 케틀벨 수트케이스 제자리 행진",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "외복사근·요방형근·악력",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "좌우 각 40초",
    "restSec": 45,
    "pairName": "포어암 플랭크 & 데드버그",
    "prep": "한 손으로 케틀벨을 들고 상체가 기울지 않게 수직을 유지합니다.",
    "steps": [
      "수직 기립 셋업: 케틀벨을 가방 들듯 한 손으로 쥐고 반대편 옆구리와 복부에 강한 힘을 줍니다.",
      "교대 무릎 리프트: 상체 수직 균형을 유지한 채 한쪽 무릎씩 골반 높이까지 천천히 들어 올립니다.",
      "좌우 교대 스위치: 40초간 리듬을 맞춰 제자리 행진 후 반대 손으로 옮겨 반복합니다."
    ],
    "breathing": "무릎을 들어 올릴 때 짧게 내쉬며 복압을 유지하고 일정한 호흡을 유지합니다.",
    "tips": "케틀벨 무게에 상체가 옆으로 무너지거나 무릎을 낮게 끌지 않도록 똑바로 서세요."
  },
  {
    "id": "home_kb_sumo_deadlift",
    "mode": "home",
    "category": "하체·파워",
    "presets": [
      "all",
      "lower_core",
      "riding_recovery"
    ],
    "name": "14kg 케틀벨 스모 데드리프트",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "내전근·대둔근·햄스트링",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "15회",
    "restSec": 60,
    "pairName": "레그프레스 / 인어 사이",
    "prep": "양발을 어깨너비 1.5배 이상 넓게 벌리고 발끝을 35~45도 바깥쪽으로 열어 중앙에 케틀벨을 둡니다.",
    "steps": [
      "척추 중립을 유지한 채 엉덩이를 뒤로 빼며 무릎을 발끝 방향으로 열어 케틀벨 손잡이를 잡습니다.",
      "발바닥 전체로 바닥을 강하게 밀어내며 무릎과 고관절을 동시에 펴고 일어납니다.",
      "정점에서 대둔근과 허벅지 안쪽(내전근)을 수축한 뒤 힙 힌지로 천천히 내려놓습니다."
    ],
    "breathing": "내려가며 깊게 들이마시고, 바닥을 밀며 일어날 때 강하게 내쉽니다.",
    "tips": "무릎이 안쪽으로 모이지 않도록 발끝과 같은 방향을 유지하세요."
  },
  {
    "id": "home_kb_reverse_lunge",
    "mode": "home",
    "category": "하체·파워",
    "presets": [
      "all",
      "lower_core"
    ],
    "name": "14kg 케틀벨 리버스 런지",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "대퇴사두근·대둔근·고관절 안정근",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "좌우 각 10회",
    "restSec": 60,
    "pairName": "레그프레스 / 레그 익스텐션",
    "prep": "케틀벨을 가슴 앞(고블릿 그립)에 단단히 받쳐 들고 양발을 골반 너비로 섭니다.",
    "steps": [
      "한쪽 다리를 뒤로 길게 뻗으며 뒷무릎이 바닥에 닿기 직전까지 수직으로 앉습니다.",
      "앞발 뒤꿈치로 지면을 힘껏 눌러 앞쪽 대퇴사두와 둔근 힘으로 제자리로 돌아옵니다.",
      "좌우 각 10회씩 골반이 좌우로 흔들리지 않게 진행합니다."
    ],
    "breathing": "뒤로 앉을 때 들이마시고, 앞다리로 밀어 올라올 때 내쉽니다.",
    "tips": "무릎 전방 부담이 적어 스쿼트 대체로 적합하며, 앞무릎이 안쪽으로 쓰러지지 않게 유지하세요."
  },
  {
    "id": "home_kb_calf_raise",
    "mode": "home",
    "category": "하체·파워",
    "presets": [
      "all",
      "lower_core",
      "riding_recovery"
    ],
    "name": "14kg 케틀벨 스탠딩 카프 레이즈",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "비복근·가자미근(종아리)·발목 안정화",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "15회",
    "restSec": 45,
    "pairName": "종아리·아킬레스건 강화",
    "prep": "한 손으로 케틀벨을 들고 다른 손은 벽이나 치닝디핑 프레임을 가볍게 잡아 균형을 맞춥니다.",
    "steps": [
      "양발(또는 한 발)을 골반 너비로 두고 무릎을 곧게 편 상태를 유지합니다.",
      "엄지발가락 아래 볼 부분으로 바닥을 밀어 뒤꿈치를 최대한 높게 들어 1초 수축합니다.",
      "종아리 신전을 느끼며 2초간 천천히 뒤꿈치를 바닥 가까이 내립니다."
    ],
    "breathing": "뒤꿈치를 들어 올릴 때 내쉬고, 천천히 내릴 때 들이마십니다.",
    "tips": "반동으로 튕기지 말고 최고점에서 1초 정지해 종아리 수축을 극대화하세요."
  },
  {
    "id": "home_kb_clean_press",
    "mode": "home",
    "category": "상체 밀기·어깨",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "14kg 케틀벨 원암 클린 & 프레스",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "전면·측면 삼각근·삼두근·코어·둔근",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "좌우 각 8회",
    "restSec": 60,
    "pairName": "숄더 프레스 머신",
    "prep": "발보다 반 발짝 앞 바닥에 케틀벨을 두고 한 손으로 잡아 힙 힌지 자세를 취합니다.",
    "steps": [
      "둔근·힙 스냅 탄력으로 케틀벨을 당기며 팔꿈치를 안으로 말아 랙 포지션(가슴 앞)으로 부드럽게 올립니다.",
      "복부와 엉덩이를 단단히 잠근 뒤 손바닥이 정면을 향하게 회전하며 머리 위로 프레스합니다.",
      "다시 랙 포지션을 거쳐 힙 힌지로 가랑이 사이를 지나며 다음 반복을 이어갑니다."
    ],
    "breathing": "랙으로 올릴 때 짧게 뱉고, 프레스 전 숨을 참고 코어를 잠근 뒤 정점에서 내쉽니다.",
    "tips": "클린 시 케틀벨이 손목을 때리지 않도록 팔을 뻗지 말고 몸 가까이 당겨 감아올리세요."
  },
  {
    "id": "home_pushup_scapula",
    "mode": "home",
    "category": "상체 밀기·어깨",
    "presets": [
      "all",
      "upper_core",
      "warmup"
    ],
    "name": "푸시업 바 스카풀라 푸시업",
    "equipment": "푸시업 바",
    "targetMuscle": "전거근·견갑 안정근·전면 삼각근",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "12회",
    "restSec": 45,
    "pairName": "견갑 전인·어깨 안정화",
    "prep": "푸시업 바를 어깨 수직 아래에 두고 팔꿈치를 완전히 편 하이 플랭크 자세를 취합니다.",
    "steps": [
      "팔꿈치를 전혀 구부리지 않은 상태에서 가슴만 아래로 내려 양 날개뼈를 가운데로 모읍니다(후인).",
      "푸시업 바를 강하게 아래로 밀어 등을 천장 쪽으로 살짝 둥글게 밀어 올립니다(전인).",
      "정점에서 겨드랑이 아래 전거근 수축을 1초 유지한 뒤 천천히 반복합니다."
    ],
    "breathing": "날개뼈를 모으며 내려갈 때 들이마시고, 강하게 밀어 올릴 때 내쉽니다.",
    "tips": "허리가 아래로 꺾이지 않도록 복부와 엉덩이 긴장을 유지하고 견갑골만 움직이세요."
  },
  {
    "id": "home_kb_upright_row",
    "mode": "home",
    "category": "상체 당기기",
    "presets": [
      "all",
      "upper_core"
    ],
    "name": "14kg 케틀벨 하이풀 (업라이트 로우)",
    "equipment": "14kg 케틀벨",
    "targetMuscle": "측면 삼각근·상부 승모근·능형근",
    "defaultWeightKg": 14,
    "defaultSets": 3,
    "defaultReps": "12회",
    "restSec": 45,
    "pairName": "측면 어깨·등 상부 당기기",
    "prep": "케틀벨 손잡이 양옆을 두 손으로 잡고 어깨너비로 바르게 서서 어깨를 아래로 내립니다.",
    "steps": [
      "코어 긴장을 유지한 채 팔꿈치가 손목보다 항상 위쪽에 오도록 옆·위 방향으로 당깁니다.",
      "어깨 충돌 방지를 위해 턱 밑까지 억지로 당기지 않고 가슴 상단(쇄골 아래) 높이까지만 끌어올립니다.",
      "측면 삼각근과 승모근 긴장을 유지하며 2초간 천천히 내려옵니다."
    ],
    "breathing": "당겨 올릴 때 내쉬고, 천천히 내릴 때 들이마십니다.",
    "tips": "어깨 충돌 증후군 예방을 위해 반드시 가슴 상단 높이까지만 당기고, 어깨를 귀 쪽으로 으쓱하지 마세요."
  },
  {
    "id": "home_inverted_row",
    "mode": "home",
    "category": "상체 당기기",
    "presets": [
      "all",
      "upper_core",
      "lower_core",
      "riding_recovery"
    ],
    "name": "치닝디핑 인버티드 로우",
    "equipment": "치닝디핑",
    "targetMuscle": "광배근·능형근·후면 삼각근·이두근",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "8회",
    "restSec": 75,
    "pairName": "롱 풀 (시티드 로우)",
    "prep": "치닝디핑 딥스 손잡이(또는 낮은 바)를 오버그립으로 잡고 다리를 앞으로 뻗어 몸을 대각선 일직선으로 만듭니다.",
    "steps": [
      "복부와 엉덩이에 힘을 주어 머리부터 발뒤꿈치까지 처지지 않게 고정합니다.",
      "가슴을 바/손잡이 사이로 끌어당기며 양 날개뼈를 등 중앙으로 강하게 조입니다.",
      "정점에서 1초 정지한 뒤 2초간 통제하며 팔을 펴 내려옵니다."
    ],
    "breathing": "가슴을 당겨 올릴 때 내쉬고, 내려갈 때 들이마십니다.",
    "tips": "무릎을 굽혀 발을 당기면 난이도를 쉽게 조절할 수 있으며, 서서 허리를 숙이는 로우보다 요추 부담이 적습니다."
  },
  {
    "id": "home_side_plank",
    "mode": "home",
    "category": "코어·마무리",
    "presets": [
      "all",
      "upper_core",
      "lower_core",
      "riding_recovery"
    ],
    "name": "사이드 플랭크",
    "equipment": "맨몸·매트",
    "targetMuscle": "외복사근·요방형근·중둔근",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "좌우 각 35초",
    "restSec": 45,
    "pairName": "측면 코어·골반 안정화",
    "prep": "옆으로 누워 한쪽 팔꿈치를 어깨 수직 아래 바닥에 대고 양발을 위아래로 포개거나 앞뒤로 둡니다.",
    "steps": [
      "발 옆면과 팔뚝으로 매트를 밀어내며 골반을 들어 머리-척추-발끝 일직선을 만듭니다.",
      "아래쪽 옆구리(외복사근)와 중둔근으로 골반이 아래로 처지지 않게 버팁니다.",
      "규칙적으로 호흡하며 좌우 각 35초씩 버팁니다."
    ],
    "breathing": "숨을 참지 말고 흉곽을 열어 일정하게 호흡합니다.",
    "tips": "엉덩이가 뒤로 빠지거나 어깨가 귀로 솟지 않도록 몸을 수직 평면에 세워 유지하세요."
  },
  {
    "id": "home_bird_dog",
    "mode": "home",
    "category": "코어·마무리",
    "presets": [
      "all",
      "upper_core",
      "lower_core",
      "riding_recovery"
    ],
    "name": "버드독 (척추 중립 코어)",
    "equipment": "맨몸·매트",
    "targetMuscle": "척추기립근·복횡근·대둔근",
    "defaultWeightKg": null,
    "defaultSets": 3,
    "defaultReps": "좌우 각 10회",
    "restSec": 45,
    "pairName": "요추 중립 코어 재활",
    "prep": "매트 위 네발기기 자세(어깨 아래 손목, 골반 아래 무릎)를 잡고 복압을 가볍게 채웁니다.",
    "steps": [
      "허리가 꺾이거나 골반이 한쪽으로 기울지 않도록 고정합니다.",
      "오른팔을 귀 옆으로, 왼쪽 다리를 뒤로 수평이 되게 천천히 뻗어 2초간 정지합니다.",
      "제자리로 돌아온 뒤 반대쪽 팔다리를 교차로 뻗으며 좌우 각 10회 진행합니다."
    ],
    "breathing": "팔다리를 뻗고 멈출 때 내쉬며 복압을 유지하고, 돌아올 때 들이마십니다.",
    "tips": "다리를 높이 차올리면 허리가 꺾이므로 발뒤꿈치를 뒤쪽 벽으로 민다는 느낌으로 수평까지만 뻗으세요."
  },
  {
    "id": "home_smr_quad_itb",
    "mode": "home",
    "category": "웜업·이완",
    "presets": [
      "all",
      "warmup",
      "riding_recovery"
    ],
    "name": "폼롤러 앞허벅지·장경인대 이완",
    "equipment": "폼롤러",
    "targetMuscle": "대퇴사두근·외측광근·장경인대",
    "defaultWeightKg": null,
    "defaultSets": 2,
    "defaultReps": "좌우 각 45초",
    "restSec": 20,
    "pairName": "라이딩 후 허벅지 근막 이완",
    "prep": "플랭크 자세처럼 팔꿈치를 바닥에 대고 엎드려 한쪽 허벅지 앞·바깥쪽 아래에 폼롤러를 가로로 둡니다.",
    "steps": [
      "반대쪽 발을 바닥에 지지해 체중 압력을 조절하며 앞허벅지(대퇴사두근)를 위아래로 천천히 굴립니다.",
      "몸을 30도 옆으로 살짝 틀어 외측광근·장경인대 부위를 부드럽게 지그시 풀어줍니다.",
      "무릎 뼈와 고관절 뼈 바로 위는 피하고 좌우 각 45초씩 진행합니다."
    ],
    "breathing": "자극이 큰 지점에서 숨을 멈추지 말고 길게 내쉬며 허벅지 힘을 뺍니다.",
    "tips": "옆허벅지 통증이 너무 심하면 반대 다리로 체중을 많이 분산시켜 부드럽게 굴리세요."
  }
];

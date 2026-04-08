-- Seed knowledge base articles
-- Content derived from real caregiving experience documented by caregiver 闻波 on Xiaohongshu

INSERT INTO articles (title_zh, title_en, content_zh, content_en, category, tags, is_published) VALUES
(
  '处理老人大便失禁的经验',
  'Managing Fecal Incontinence in Elderly Care',
  '对于阿尔茨海默症患者，大便失禁是常见问题。关键经验：\n\n1. 规律饮食：每日三餐定时定量，主食米饭或面条，蔬菜水果适量\n2. 晚餐少量：晚上八点后只吃少量水果和坚果\n3. 记录大便时间规律：大多数老人晚上10点到第二天中午有一次大便\n4. 定时提醒：根据个人规律，每2小时提醒上厕所一次\n5. 饮水管理：白天充足饮水，晚上8点后减少\n6. 穿着准备：使用纸尿裤或成人护理垫作为保护\n\n重要提示：观察和记录比药物更有效。每个人的规律不同，需要耐心摸索。',
  'Fecal incontinence is common in Alzheimer''s patients. Key insights:\n\n1. Regular meals: Three meals at consistent times, with rice/noodles, vegetables, and fruits\n2. Light dinner: Only small amounts of fruits/nuts after 8pm\n3. Track patterns: Most elderly have bowel movements between 10pm and noon\n4. Scheduled reminders: Toilet reminders every 2 hours based on individual patterns\n5. Hydration management: Drink plenty during the day, reduce after 8pm\n6. Protection: Use adult diapers or care pads as backup\n\nImportant: Observation and tracking are more effective than medication. Each person has unique patterns — patience is key.',
  'incontinence',
  ARRAY['bowel', 'alzheimer', 'routine'],
  true
),
(
  '小便失禁的护理要点',
  'Urinary Incontinence Care Essentials',
  '控制老人小便失禁需要耐心和细致观察：\n\n1. 建立如厕时间表：根据记录，一般每2-3小时需要如厕\n2. 饮水时间控制：白天每次200-300ml，晚上减少至100-150ml\n3. 定时提醒：每2小时主动提醒，不要等老人说要上厕所\n4. 夜间安排：睡前1小时停止饮水，夜间1-2次叫醒如厕\n5. 保护措施：使用护理垫保护床铺和衣物\n6. 尊重感受：避免责备，保持老人尊严\n\n数据记录的重要性：每天记录饮水量、饮水时间、小便时间和次数，可以发现规律，大大减少失禁事件。',
  'Managing urinary incontinence requires patience and careful observation:\n\n1. Establish toilet schedule: Generally every 2-3 hours based on patterns\n2. Control fluid timing: 200-300ml per time during day, reduce to 100-150ml evening\n3. Proactive reminders: Remind every 2 hours, don''t wait for the person to ask\n4. Night planning: Stop fluids 1 hour before bed, wake 1-2 times for toilet\n5. Protection: Use care pads for bed and clothing\n6. Dignity first: Avoid blame, maintain the person''s dignity\n\nThe power of tracking: Logging fluid intake, timing, and urination patterns daily helps identify routines and greatly reduces incontinence events.',
  'incontinence',
  ARRAY['urination', 'schedule', 'hydration'],
  true
),
(
  '阿尔茨海默症老人的日常照护',
  'Daily Care for Alzheimer''s Patients',
  '日常照护的核心原则：\n\n1. 保持规律：固定的作息时间有助于减少混乱\n2. 简化环境：物品摆放固定位置，减少选择\n3. 耐心沟通：使用简短清晰的语言，一次一件事\n4. 情绪管理：当老人躁动时，转移注意力而不是争论\n5. 身体活动：每天适量散步，有助于睡眠和情绪\n6. 认知训练：简单的游戏、看老照片、听老歌\n7. 安全第一：防跌倒、防走失、防烫伤\n\n照护者也要照顾好自己，寻求家人支持，适时休息。',
  'Core principles of daily care:\n\n1. Maintain routine: Fixed schedules reduce confusion\n2. Simplify environment: Keep items in fixed places, reduce choices\n3. Patient communication: Use short, clear language, one thing at a time\n4. Emotional management: When agitated, redirect attention rather than argue\n5. Physical activity: Daily walks aid sleep and mood\n6. Cognitive exercises: Simple games, old photos, familiar music\n7. Safety first: Prevent falls, wandering, and burns\n\nCaregivers must also care for themselves — seek family support and take breaks.',
  'daily_care',
  ARRAY['alzheimer', 'routine', 'safety'],
  true
),
(
  '老人营养饮食指南',
  'Nutrition Guide for Elderly',
  '营养均衡对老人健康至关重要：\n\n1. 三餐规律：早餐丰富，午餐适中，晚餐少量\n2. 蛋白质充足：鸡蛋、鱼、瘦肉、豆制品\n3. 粗细搭配：米饭搭配杂粮，面条搭配蔬菜\n4. 易消化：切小块、煮软烂、避免过硬\n5. 少盐少糖：减少心血管和糖尿病风险\n6. 适量水果：香蕉、苹果等易消化水果\n7. 补充水分：每天1500-2000ml水\n\n避免：油炸食品、生冷食物、过甜过咸、难消化的食物。',
  'Balanced nutrition is vital for elderly health:\n\n1. Regular meals: Substantial breakfast, moderate lunch, light dinner\n2. Adequate protein: Eggs, fish, lean meat, tofu\n3. Whole grains: Mix rice with grains, noodles with vegetables\n4. Easy to digest: Cut small, cook soft, avoid tough foods\n5. Low salt/sugar: Reduce cardiovascular and diabetes risk\n6. Moderate fruits: Banana, apple, and other easy-to-digest fruits\n7. Hydration: 1500-2000ml water daily\n\nAvoid: fried foods, raw/cold foods, overly sweet/salty, hard-to-digest items.',
  'nutrition',
  ARRAY['diet', 'meals', 'hydration'],
  true
),
(
  '用药安全管理',
  'Safe Medication Management',
  '老人用药安全的关键：\n\n1. 按时服药：使用药盒分装，每周整理一次\n2. 剂量准确：严格按医嘱，不自行调整\n3. 记录反应：观察副作用，及时反馈医生\n4. 避免遗漏：设置提醒，照护者核对\n5. 避免重复：多种药物要错开时间\n6. 保存得当：避光、阴凉、干燥\n7. 定期复诊：及时调整药物方案\n\n警惕：不要同时服用多种感冒药、不要用牛奶送药、不要漏服也不要补服。',
  'Key principles for safe medication:\n\n1. On schedule: Use pill organizers, sort weekly\n2. Accurate dosing: Follow prescriptions exactly, never self-adjust\n3. Track reactions: Watch side effects, report to doctor\n4. Prevent missed doses: Set reminders, caregiver double-checks\n5. Avoid duplicates: Space out multiple medications\n6. Store properly: Away from light, cool, dry\n7. Regular follow-up: Adjust medication plans as needed\n\nWarnings: Don''t combine cold medicines, don''t take with milk, don''t skip or double-up.',
  'medication',
  ARRAY['medication', 'safety', 'schedule'],
  true
),
(
  '照护者的心理健康',
  'Caregiver Mental Health',
  '照护老人是长期且艰辛的工作，照护者自身的心理健康同样重要：\n\n1. 接受情绪：愤怒、悲伤、疲惫都是正常的\n2. 寻求支持：加入照护者互助群，分享经验\n3. 定期休息：安排替代照护时间，给自己放松\n4. 保持社交：不要与外界完全隔离\n5. 运动放松：每天散步、做家务也是运动\n6. 合理期待：接受老人的病情发展，不要苛责自己\n7. 专业帮助：必要时寻求心理咨询\n\n记住：只有照护好自己，才能照护好老人。',
  'Caring for elderly is long and demanding work — caregiver mental health matters too:\n\n1. Accept emotions: Anger, sadness, exhaustion are all normal\n2. Seek support: Join caregiver groups, share experiences\n3. Regular breaks: Arrange respite care, relax yourself\n4. Stay social: Don''t isolate completely\n5. Exercise: Walking, housework also count\n6. Reasonable expectations: Accept disease progression, don''t blame yourself\n7. Professional help: Seek counseling when needed\n\nRemember: You can only care well for others if you care for yourself first.',
  'mental_health',
  ARRAY['caregiver', 'wellbeing', 'support'],
  true
);

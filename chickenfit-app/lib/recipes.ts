export interface Ingredient { n: string; a: string; }

export interface Recipe {
  id: number;
  e: string;
  n: string;
  cal: number;
  p: number;
  c: number;
  f: number;
  t: number;
  g: string;
  tags: string[];
  bg: string;
  type: "food" | "smoothie";
  health: string;
  ing: Ingredient[];
  steps: string[];
}

export const DB: Recipe[] = [
  // ── 0-7: HEALTHY MEALS (existing) ──
  { id:0, e:"🍗", n:"Gà nướng chanh mật ong", cal:285, p:42, c:12, f:7, t:25, g:"Tăng cơ", tags:["Tăng cơ","Nướng"], bg:"#FAF0E2", type:"food",
    health:"Không dầu mỡ · Kháng viêm · Vitamin C",
    ing:[{n:"Ức gà",a:"200g"},{n:"Mật ong",a:"1 tbsp"},{n:"Chanh tươi",a:"½ quả"},{n:"Tỏi băm",a:"2 tép"},{n:"Dầu olive",a:"1 tsp"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Ức gà rửa sạch, dùng búa đập mỏng.","Pha marinade mật ong + chanh + tỏi, ướp 20 phút.","Nướng 200°C hoặc chảo grill 12-14 phút, lật giữa chừng.","Để nghỉ 3 phút trước khi thái."] },

  { id:1, e:"🥗", n:"Salad ức gà Hy Lạp", cal:210, p:35, c:8, f:6, t:12, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#E8EFE4", type:"food",
    health:"Raw food · Chất xơ cao · Anti-oxidant",
    ing:[{n:"Ức gà luộc",a:"150g"},{n:"Cà chua bi",a:"100g"},{n:"Dưa leo",a:"1 quả"},{n:"Feta ít béo",a:"30g"},{n:"Oliu đen",a:"10 hạt"},{n:"Dầu olive + giấm táo",a:"1 tbsp"}],
    steps:["Luộc gà 15 phút, để nguội xé sợi.","Cắt cà chua, dưa leo.","Trộn tất cả nguyên liệu.","Rưới dầu olive, rắc feta và tiêu đen."] },

  { id:2, e:"🍚", n:"Bowl gà quinoa rau củ", cal:380, p:42, c:35, f:8, t:25, g:"Duy trì", tags:["Duy trì","Meal prep"], bg:"#F5EDDC", type:"food",
    health:"Gluten-free · Complete protein · Fiber cao",
    ing:[{n:"Ức gà nướng",a:"150g"},{n:"Quinoa",a:"60g"},{n:"Bông cải xanh",a:"100g"},{n:"Cà rốt",a:"50g"},{n:"Bơ",a:"¼ quả"},{n:"Chanh + muối",a:"vừa đủ"}],
    steps:["Nấu quinoa tỉ lệ 1:2, 15 phút.","Hấp bông cải + cà rốt 5 phút.","Nướng gà, thái mỏng.","Xếp tất cả vào bát, thêm bơ + chanh."] },

  { id:3, e:"🌮", n:"Wrap gà whole wheat", cal:330, p:40, c:26, f:8, t:20, g:"Duy trì", tags:["Duy trì"], bg:"#F5E8E0", type:"food",
    health:"Whole grain · Probiotic · Thấp GI",
    ing:[{n:"Ức gà",a:"150g"},{n:"Bánh tortilla ngũ cốc",a:"1 cái"},{n:"Sữa chua Greek 0%",a:"3 tbsp"},{n:"Xà lách + rocket",a:"50g"},{n:"Cà chua",a:"½ quả"},{n:"Cumin, paprika",a:"1 tsp mỗi"}],
    steps:["Ướp gà cumin + paprika + muối 10 phút.","Nướng chảo không dầu 8-10 phút.","Hâm bánh tortilla 1 phút.","Phết sữa chua, xếp gà + rau, cuộn chặt."] },

  { id:4, e:"🍲", n:"Gà hầm khoai lang", cal:310, p:38, c:22, f:7, t:35, g:"Tăng cơ", tags:["Tăng cơ","Meal prep"], bg:"#F7EEDC", type:"food",
    health:"Beta-carotene · Kháng viêm · Sạch",
    ing:[{n:"Ức gà",a:"200g"},{n:"Khoai lang",a:"150g"},{n:"Cà rốt",a:"1 củ"},{n:"Nước dùng gà",a:"300ml"},{n:"Hành tây",a:"½ củ"},{n:"Thyme, muối hồng",a:"vừa đủ"}],
    steps:["Cắt gà, khoai lang 3cm.","Phi hành tây với dầu olive.","Xào gà săn, thêm rau củ + nước dùng.","Hầm 25 phút, nêm muối tiêu."] },

  { id:5, e:"🥙", n:"Gà shawarma áp chảo", cal:265, p:44, c:4, f:8, t:30, g:"Giảm mỡ", tags:["Giảm mỡ"], bg:"#F2E4D6", type:"food",
    health:"Zero carb · Spice metabolism · Probiotic",
    ing:[{n:"Ức gà",a:"200g"},{n:"Sữa chua Greek 0%",a:"50g"},{n:"Gia vị shawarma",a:"2 tsp"},{n:"Tỏi",a:"3 tép"},{n:"Chanh",a:"1 quả"},{n:"Dầu olive",a:"1 tsp"}],
    steps:["Trộn sữa chua + gia vị + tỏi + chanh, ướp gà 1 tiếng.","Làm nóng chảo cast-iron, phết dầu olive.","Áp chảo 6-7 phút mỗi mặt.","Thái mỏng theo thớ, dùng với rau tươi."] },

  { id:6, e:"🍱", n:"Gà teriyaki meal prep", cal:355, p:45, c:24, f:7, t:25, g:"Tăng cơ", tags:["Tăng cơ","Meal prep"], bg:"#EEE8D8", type:"food",
    health:"Reduced sodium · Batch cook 5 ngày",
    ing:[{n:"Ức gà",a:"200g"},{n:"Nước tương ít muối",a:"2 tbsp"},{n:"Mật ong",a:"1.5 tbsp"},{n:"Gừng băm",a:"1 tsp"},{n:"Tinh bột ngô",a:"1 tsp"},{n:"Mè đen",a:"1 tsp"}],
    steps:["Pha sốt teriyaki: nước tương + mật ong + gừng.","Áp chảo gà nguyên miếng không dầu.","Đổ sốt, trở gà 4-5 phút đến thấm đều.","Thái lát, rắc mè, chia hộp meal prep."] },

  { id:7, e:"🌿", n:"Gà hấp gừng hành", cal:195, p:40, c:2, f:4, t:18, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#E4EFE6", type:"food",
    health:"Zero dầu · 95% dinh dưỡng · Detox",
    ing:[{n:"Ức gà",a:"200g"},{n:"Gừng tươi",a:"30g"},{n:"Hành lá",a:"5 nhánh"},{n:"Dầu mè",a:"1 tbsp"},{n:"Nước tương ít muối",a:"2 tbsp"},{n:"Muối hồng",a:"1 tsp"}],
    steps:["Khứa gà, nhét lát gừng vào, xoa muối hồng.","Hấp trên nước sôi 15-18 phút không mở nắp.","Phi dầu mè với hành lá đến thơm vàng.","Rưới dầu hành nóng lên gà trước khi ăn."] },

  // ── 8-12: SMOOTHIES (existing) ──
  { id:8, e:"🥤", n:"Smoothie Chuối Protein", cal:340, p:38, c:35, f:6, t:5, g:"Sinh tố", tags:["Sinh tố","Tăng cơ","<15 phút"], bg:"#F5EDDF", type:"smoothie",
    health:"Post-workout · Carb nhanh · Natural protein",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Chuối đông lạnh",a:"1 quả"},{n:"Sữa hạnh nhân",a:"250ml"},{n:"Yến mạch",a:"2 tbsp"},{n:"Mật ong",a:"1 tsp"},{n:"Đá",a:"5 viên"}],
    steps:["Luộc gà để nguội hoàn toàn.","Cho sữa vào máy xay trước, rồi gà, chuối, yến mạch.","Xay 45-60 giây đến mịn.","Uống ngay sau 15 phút tập."] },

  { id:9, e:"🥑", n:"Smoothie Bơ Rau Bina", cal:310, p:32, c:8, f:18, t:5, g:"Sinh tố", tags:["Sinh tố","Giảm mỡ","<15 phút"], bg:"#E4EDE5", type:"smoothie",
    health:"Healthy fat · Keto-friendly · Chlorophyll",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Bơ chín",a:"½ quả"},{n:"Rau bina",a:"50g"},{n:"Sữa hạnh nhân",a:"200ml"},{n:"Chanh",a:"½ quả"},{n:"Đá",a:"5 viên"}],
    steps:["Gà luộc để nguội trong tủ lạnh.","Rửa rau bina, khoét bơ lấy thịt.","Cho sữa vào trước, rồi gà, bơ, rau, chanh, đá.","Xay 60 giây. Không thêm đường."] },

  { id:10, e:"🌾", n:"Smoothie Yến Mạch Sữa", cal:390, p:42, c:40, f:7, t:5, g:"Sinh tố", tags:["Sinh tố","Tăng cơ","<15 phút"], bg:"#F7EDDA", type:"smoothie",
    health:"Beta-glucan · Slow release energy · Bữa sáng",
    ing:[{n:"Ức gà luộc nguội",a:"120g"},{n:"Yến mạch",a:"50g"},{n:"Sữa tươi",a:"250ml"},{n:"Chuối",a:"½ quả"},{n:"Hạt chia",a:"1 tbsp"},{n:"Quế",a:"¼ tsp"}],
    steps:["Ngâm yến mạch với 100ml sữa 5 phút.","Gà luộc nguội cắt nhỏ.","Xay tất cả 60-90 giây tốc độ tối đa.","Rắc yến mạch + hạt chia lên mặt."] },

  { id:11, e:"🫐", n:"Smoothie Việt Quất Recovery", cal:290, p:40, c:22, f:5, t:5, g:"Sinh tố", tags:["Sinh tố","Giảm mỡ","<15 phút"], bg:"#EAE4D8", type:"smoothie",
    health:"Antioxidant · Muscle recovery · Anti-inflammation",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Việt quất",a:"100g"},{n:"Sữa chua Greek 0%",a:"150g"},{n:"Sữa hạnh nhân",a:"150ml"},{n:"Mật ong",a:"1 tsp"},{n:"Củ dền (tùy)",a:"30g"}],
    steps:["Gà luộc nguội, cắt nhỏ.","Cho sữa hạnh nhân vào trước, thêm các nguyên liệu còn lại.","Xay 60 giây — màu tím đẹp từ việt quất.","Uống sau 30-60 phút tập."] },

  { id:12, e:"🥭", n:"Smoothie Xoài Gừng Nghệ", cal:250, p:32, c:28, f:4, t:5, g:"Sinh tố", tags:["Sinh tố","Giảm mỡ","<15 phút"], bg:"#F5E8D6", type:"smoothie",
    health:"Curcumin · Kháng viêm · Tropical protein",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Xoài đông lạnh",a:"100g"},{n:"Gừng tươi",a:"10g"},{n:"Nước cốt dừa light",a:"100ml"},{n:"Sữa hạnh nhân",a:"100ml"},{n:"Bột nghệ",a:"¼ tsp"}],
    steps:["Gà luộc nguội, gừng gọt vỏ.","Cho chất lỏng vào máy xay trước.","Thêm gà, xoài, gừng, nghệ. Xay 60 giây.","Rắc bột nghệ + tiêu đen lên mặt."] },

  // ── 13-22: NƯỚNG / GRILLED ──
  { id:13, e:"🌶️", n:"Gà nướng sả ớt", cal:240, p:40, c:6, f:6, t:28, g:"Giảm mỡ", tags:["Giảm mỡ","Nướng"], bg:"#FAEAE0", type:"food",
    health:"Capsaicin đốt mỡ · Kháng khuẩn · Zero carb",
    ing:[{n:"Ức gà",a:"200g"},{n:"Sả băm",a:"2 cây"},{n:"Ớt đỏ",a:"2 quả"},{n:"Nước mắm",a:"1 tbsp"},{n:"Đường thốt nốt",a:"1 tsp"},{n:"Dầu olive",a:"1 tsp"}],
    steps:["Băm nhuyễn sả + ớt, trộn nước mắm + đường thốt nốt.","Ướp gà với hỗn hợp 30 phút.","Nướng lò 200°C hoặc chảo grill 14 phút.","Dùng nóng với rau sống."] },

  { id:14, e:"🏮", n:"Gà nướng ngũ vị hương", cal:260, p:41, c:5, f:7, t:30, g:"Duy trì", tags:["Duy trì","Nướng"], bg:"#F7E8DA", type:"food",
    health:"Spice antioxidant · Tiêu hóa tốt · Traditional",
    ing:[{n:"Ức gà",a:"200g"},{n:"Ngũ vị hương",a:"1.5 tsp"},{n:"Nước tương",a:"2 tbsp"},{n:"Dầu mè",a:"1 tsp"},{n:"Tỏi",a:"3 tép"},{n:"Gừng",a:"1 lát"}],
    steps:["Trộn ngũ vị hương + nước tương + dầu mè + tỏi + gừng.","Ướp gà tối thiểu 1 tiếng, tốt nhất qua đêm.","Nướng 200°C, 15 phút mỗi mặt.","Để nguội 3 phút, thái chéo thớ."] },

  { id:15, e:"🔥", n:"Gà nướng BBQ healthy", cal:275, p:43, c:10, f:6, t:25, g:"Tăng cơ", tags:["Tăng cơ","Nướng"], bg:"#F5E4D8", type:"food",
    health:"High protein · Smoke flavor · No sugar added",
    ing:[{n:"Ức gà",a:"200g"},{n:"Tương cà không đường",a:"2 tbsp"},{n:"Giấm táo",a:"1 tbsp"},{n:"Paprika khói",a:"1 tsp"},{n:"Tỏi bột",a:"½ tsp"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Trộn tất cả gia vị thành sốt BBQ healthy.","Phết sốt lên gà, ướp 20 phút.","Nướng grill 12 phút, phết thêm sốt khi lật.","Dùng kèm bắp ngô hấp hoặc khoai lang."] },

  { id:16, e:"🍯", n:"Gà nướng miso mật ong", cal:268, p:40, c:14, f:6, t:25, g:"Duy trì", tags:["Duy trì","Nướng"], bg:"#F2EAD8", type:"food",
    health:"Probiotic miso · Umami · Gut health",
    ing:[{n:"Ức gà",a:"200g"},{n:"Miso trắng",a:"1 tbsp"},{n:"Mật ong",a:"1 tbsp"},{n:"Nước tương ít muối",a:"1 tbsp"},{n:"Dầu mè",a:"1 tsp"},{n:"Hành lá",a:"2 nhánh"}],
    steps:["Trộn miso + mật ong + nước tương + dầu mè.","Ướp gà 20-30 phút.","Nướng grill hoặc lò 200°C 13-15 phút.","Rắc hành lá thái nhỏ khi dùng."] },

  { id:17, e:"🧂", n:"Gà nướng muối ớt Tây Bắc", cal:215, p:41, c:2, f:5, t:20, g:"Giảm mỡ", tags:["Giảm mỡ","Nướng","<15 phút"], bg:"#F0E8E0", type:"food",
    health:"Đơn giản · Zero carb · Giữ nguyên vị",
    ing:[{n:"Ức gà",a:"200g"},{n:"Muối tiêu rừng",a:"2 tsp"},{n:"Ớt khô",a:"1 tsp"},{n:"Tỏi bột",a:"½ tsp"},{n:"Dầu olive",a:"1 tsp"},{n:"Chanh",a:"½ quả"}],
    steps:["Trộn muối + tiêu + ớt khô + tỏi bột.","Xoa đều lên gà, để 15 phút.","Nướng grill 10-12 phút mỗi mặt.","Vắt chanh và dùng ngay."] },

  { id:18, e:"🇰🇷", n:"Gà nướng Korean BBQ", cal:255, p:42, c:8, f:6, t:30, g:"Tăng cơ", tags:["Tăng cơ","Nướng"], bg:"#FAE8E8", type:"food",
    health:"Gochujang kháng viêm · Fermented · Probiotic",
    ing:[{n:"Ức gà",a:"200g"},{n:"Gochujang không đường",a:"1 tbsp"},{n:"Nước tương",a:"1 tbsp"},{n:"Tỏi băm",a:"3 tép"},{n:"Gừng",a:"1 tsp"},{n:"Dầu mè",a:"1 tsp"}],
    steps:["Trộn gochujang + nước tương + tỏi + gừng + dầu mè.","Ướp gà 30 phút ở nhiệt độ phòng.","Nướng grill hoặc chảo nóng 12-14 phút.","Dùng kèm rau diếp và cơm gạo lứt."] },

  { id:19, e:"🇮🇳", n:"Gà nướng tandoori", cal:245, p:43, c:5, f:6, t:35, g:"Giảm mỡ", tags:["Giảm mỡ","Nướng"], bg:"#F5E4D0", type:"food",
    health:"Turmeric kháng viêm · Spice metabolism · Zero fat",
    ing:[{n:"Ức gà",a:"200g"},{n:"Sữa chua Greek 0%",a:"80g"},{n:"Bột nghệ",a:"1 tsp"},{n:"Cumin + coriander",a:"1 tsp mỗi"},{n:"Paprika",a:"1 tsp"},{n:"Muối, chanh",a:"vừa đủ"}],
    steps:["Trộn sữa chua + nghệ + cumin + coriander + paprika.","Ướp gà ít nhất 2 tiếng hoặc qua đêm.","Nướng lò 220°C 18-20 phút, trở lật một lần.","Dùng với raita sữa chua + dưa leo."] },

  { id:20, e:"🌿", n:"Gà nướng hương thảo tỏi", cal:250, p:41, c:3, f:7, t:25, g:"Duy trì", tags:["Duy trì","Nướng"], bg:"#E8EEE4", type:"food",
    health:"Rosemary antioxidant · Mediterranean · Heart healthy",
    ing:[{n:"Ức gà",a:"200g"},{n:"Hương thảo tươi",a:"3 cành"},{n:"Tỏi",a:"4 tép"},{n:"Dầu olive",a:"1.5 tsp"},{n:"Chanh",a:"½ quả"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Đập dập tỏi, vò nát hương thảo.","Ướp gà với tỏi + hương thảo + dầu olive + chanh 20 phút.","Nướng lò 190°C 20-22 phút.","Để nghỉ 5 phút trước khi thái."] },

  { id:21, e:"🧄", n:"Gà nướng bơ tỏi balsamic", cal:270, p:40, c:6, f:8, t:25, g:"Duy trì", tags:["Duy trì","Nướng"], bg:"#F0E8E8", type:"food",
    health:"Balsamic antioxidant · Heart healthy · Italian style",
    ing:[{n:"Ức gà",a:"200g"},{n:"Giấm balsamic",a:"2 tbsp"},{n:"Tỏi băm",a:"3 tép"},{n:"Dầu olive",a:"1 tsp"},{n:"Mật ong",a:"1 tsp"},{n:"Thyme",a:"1 tsp"}],
    steps:["Trộn balsamic + tỏi + dầu olive + mật ong + thyme.","Ướp gà 20 phút.","Nướng chảo grill 12 phút, lật 1 lần.","Dùng nóng với rau xanh trộn."] },

  { id:22, e:"⚫", n:"Gà nướng tương đen", cal:260, p:41, c:8, f:6, t:25, g:"Tăng cơ", tags:["Tăng cơ","Nướng"], bg:"#E8E0D8", type:"food",
    health:"Fermented soy · Probiotic · Umami",
    ing:[{n:"Ức gà",a:"200g"},{n:"Tương đen",a:"2 tbsp"},{n:"Gừng băm",a:"1 tsp"},{n:"Tỏi",a:"2 tép"},{n:"Dầu mè",a:"1 tsp"},{n:"Đường thốt nốt",a:"½ tsp"}],
    steps:["Trộn tương đen + gừng + tỏi + dầu mè + đường.","Ướp gà 30 phút.","Áp chảo hoặc nướng grill 14 phút.","Dùng với cơm gạo lứt và dưa leo."] },

  // ── 23-30: HẤP / STEAMED ──
  { id:23, e:"🍄", n:"Gà hấp nấm đông cô", cal:210, p:39, c:4, f:4, t:22, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#EDE8E0", type:"food",
    health:"Beta-glucan · Immune boost · Thấp calo",
    ing:[{n:"Ức gà",a:"200g"},{n:"Nấm đông cô",a:"6 cái"},{n:"Gừng",a:"3 lát"},{n:"Nước tương",a:"1 tbsp"},{n:"Dầu mè",a:"1 tsp"},{n:"Hành lá",a:"3 nhánh"}],
    steps:["Ngâm nấm đông cô 20 phút, vắt nước.","Xếp gà + nấm + gừng vào đĩa hấp.","Hấp 18-20 phút đến chín.","Rưới nước tương + dầu mè, rắc hành lá."] },

  { id:24, e:"🍺", n:"Gà hấp bia", cal:230, p:40, c:5, f:5, t:25, g:"Duy trì", tags:["Duy trì"], bg:"#F5EDDA", type:"food",
    health:"Mềm thịt tự nhiên · Không dầu · Độc đáo",
    ing:[{n:"Ức gà",a:"200g"},{n:"Bia (hoặc nước dùng)",a:"100ml"},{n:"Sả",a:"2 cây"},{n:"Gừng",a:"3 lát"},{n:"Muối, tiêu",a:"vừa đủ"},{n:"Hành lá",a:"3 nhánh"}],
    steps:["Đặp dập sả, xếp gừng + sả vào nồi hấp.","Đổ bia vào nồi, xếp gà lên giá hấp.","Hấp 20-22 phút đến chín.","Dùng với nước chấm gừng muối tiêu."] },

  { id:25, e:"🍋", n:"Gà hấp chanh sả", cal:195, p:40, c:3, f:4, t:20, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#F0F0E0", type:"food",
    health:"Vitamin C · Detox · Zero dầu",
    ing:[{n:"Ức gà",a:"200g"},{n:"Chanh",a:"1 quả"},{n:"Sả",a:"2 cây"},{n:"Muối hồng",a:"1 tsp"},{n:"Tiêu",a:"½ tsp"},{n:"Hành lá",a:"2 nhánh"}],
    steps:["Thái lát chanh, đập dập sả.","Xếp sả vào đáy nồi hấp, gà lên trên, chanh phủ mặt.","Hấp 17-20 phút.","Rắc muối, tiêu và hành lá khi dùng."] },

  { id:26, e:"🍵", n:"Gà hấp rượu vang trắng", cal:220, p:40, c:2, f:5, t:22, g:"Duy trì", tags:["Duy trì"], bg:"#F5F0E8", type:"food",
    health:"Elegant · Tender · No added fat",
    ing:[{n:"Ức gà",a:"200g"},{n:"Rượu vang trắng",a:"3 tbsp"},{n:"Tỏi",a:"3 tép"},{n:"Thyme",a:"2 cành"},{n:"Muối, tiêu",a:"vừa đủ"},{n:"Chanh",a:"¼ quả"}],
    steps:["Xoa muối tiêu lên gà, cho tỏi đập dập + thyme vào đĩa.","Rưới rượu vang lên gà.","Hấp 18-20 phút.","Vắt chanh, dùng với rau xanh."] },

  { id:27, e:"🟡", n:"Gà hấp nghệ gừng", cal:200, p:40, c:3, f:4, t:20, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#F5EDD8", type:"food",
    health:"Curcumin · Anti-inflammatory · Detox",
    ing:[{n:"Ức gà",a:"200g"},{n:"Nghệ tươi",a:"1 nhánh"},{n:"Gừng",a:"4 lát"},{n:"Muối hồng",a:"1 tsp"},{n:"Dầu mè",a:"½ tsp"},{n:"Tiêu đen",a:"½ tsp"}],
    steps:["Thái lát nghệ + gừng, xoa đều lên gà cùng muối tiêu.","Để 15 phút cho thấm gia vị.","Hấp 18 phút.","Rưới vài giọt dầu mè trước khi dùng."] },

  { id:28, e:"🍃", n:"Gà hấp lá chuối", cal:215, p:40, c:4, f:5, t:30, g:"Duy trì", tags:["Duy trì"], bg:"#E4EEE0", type:"food",
    health:"Aroma tự nhiên · Ẩm thịt · Traditional",
    ing:[{n:"Ức gà",a:"200g"},{n:"Lá chuối",a:"2 tờ"},{n:"Sả băm",a:"1 cây"},{n:"Nghệ",a:"½ tsp"},{n:"Muối + tiêu",a:"vừa đủ"},{n:"Dừa nạo",a:"1 tbsp"}],
    steps:["Trộn sả + nghệ + muối + dừa nạo, xoa lên gà.","Gói gà trong lá chuối đã hơ lửa cho mềm.","Hấp 25-28 phút.","Mở lá chuối và dùng nóng."] },

  { id:29, e:"🌸", n:"Gà hấp hành tây tím", cal:205, p:39, c:5, f:4, t:20, g:"Giảm mỡ", tags:["Giảm mỡ"], bg:"#EEE0F0", type:"food",
    health:"Quercetin · Anti-oxidant · Heart health",
    ing:[{n:"Ức gà",a:"200g"},{n:"Hành tây tím",a:"½ củ"},{n:"Tỏi",a:"3 tép"},{n:"Nước tương",a:"1 tbsp"},{n:"Tiêu",a:"½ tsp"},{n:"Hành lá",a:"2 nhánh"}],
    steps:["Thái hành tây mỏng, đập tỏi.","Xếp hành tây + tỏi lên gà, rưới nước tương.","Hấp 18-20 phút.","Rắc tiêu + hành lá và dùng ngay."] },

  { id:30, e:"🍊", n:"Gà hấp cam mật ong", cal:225, p:39, c:9, f:4, t:20, g:"Duy trì", tags:["Duy trì","<15 phút"], bg:"#FAF0E0", type:"food",
    health:"Vitamin C · Citrus antioxidant · Refreshing",
    ing:[{n:"Ức gà",a:"200g"},{n:"Cam tươi",a:"1 quả"},{n:"Mật ong",a:"1 tsp"},{n:"Gừng",a:"2 lát"},{n:"Muối",a:"½ tsp"},{n:"Tiêu",a:"¼ tsp"}],
    steps:["Vắt ½ cam, thái lát ½ còn lại.","Trộn nước cam + mật ong + muối + tiêu, ướp gà 15 phút.","Xếp gà + lát cam + gừng vào đĩa hấp.","Hấp 18 phút, dùng nóng."] },

  // ── 31-38: ÁP CHẢO / PAN-SEARED ──
  { id:31, e:"🌱", n:"Gà áp chảo pesto rau thơm", cal:270, p:40, c:3, f:10, t:15, g:"Duy trì", tags:["Duy trì","<15 phút"], bg:"#E4EEE0", type:"food",
    health:"Basil antioxidant · Mediterranean · Healthy fat",
    ing:[{n:"Ức gà",a:"200g"},{n:"Pesto rau quế",a:"2 tbsp"},{n:"Dầu olive",a:"1 tsp"},{n:"Tỏi",a:"2 tép"},{n:"Muối, tiêu",a:"vừa đủ"},{n:"Chanh",a:"¼ quả"}],
    steps:["Phết pesto đều lên gà, để 10 phút.","Làm nóng chảo, thêm dầu olive + tỏi.","Áp chảo gà 6-7 phút mỗi mặt ở lửa vừa.","Vắt chanh, dùng với rau xanh."] },

  { id:32, e:"🍊", n:"Gà áp chảo sốt cam", cal:255, p:41, c:8, f:6, t:18, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#FAF0E0", type:"food",
    health:"Vitamin C · Citrus burst · Low fat",
    ing:[{n:"Ức gà",a:"200g"},{n:"Nước cốt cam",a:"3 tbsp"},{n:"Mật ong",a:"1 tsp"},{n:"Gừng",a:"1 tsp"},{n:"Tỏi",a:"2 tép"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Đập mỏng gà, ướp muối tiêu.","Áp chảo không dầu 5 phút mỗi mặt.","Pha nước cam + mật ong + gừng, đổ vào chảo.","Đun 2 phút đến sốt sánh, rưới lên gà."] },

  { id:33, e:"🌿", n:"Gà áp chảo bơ tỏi thảo mộc", cal:265, p:40, c:2, f:9, t:15, g:"Duy trì", tags:["Duy trì","<15 phút"], bg:"#E8EEE4", type:"food",
    health:"Herb antioxidant · Garlic immune · Clean",
    ing:[{n:"Ức gà",a:"200g"},{n:"Bơ không muối",a:"1 tsp"},{n:"Tỏi",a:"4 tép"},{n:"Thyme tươi",a:"2 cành"},{n:"Chanh",a:"½ quả"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Ướp gà muối tiêu, đập dập tỏi.","Làm nóng chảo, cho bơ vào khi hơi nóng.","Áp chảo gà 5-6 phút mỗi mặt, thêm tỏi + thyme.","Vắt chanh khi dùng."] },

  { id:34, e:"⬛", n:"Gà áp chảo tiêu đen", cal:245, p:41, c:2, f:7, t:15, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#E8E4DC", type:"food",
    health:"Piperine metabolism · Kháng khuẩn · Simple",
    ing:[{n:"Ức gà",a:"200g"},{n:"Tiêu đen xay thô",a:"1.5 tsp"},{n:"Muối hồng",a:"1 tsp"},{n:"Tỏi bột",a:"½ tsp"},{n:"Dầu olive",a:"1 tsp"},{n:"Chanh",a:"½ quả"}],
    steps:["Ấn tiêu đen thô đều lên 2 mặt gà cùng muối + tỏi bột.","Để 10 phút cho thấm.","Áp chảo dầu olive 6 phút mỗi mặt.","Vắt chanh, dùng ngay."] },

  { id:35, e:"🍯", n:"Gà áp chảo mù tạt mật ong", cal:258, p:41, c:7, f:6, t:18, g:"Duy trì", tags:["Duy trì","<15 phút"], bg:"#F5EDDA", type:"food",
    health:"Mustard antioxidant · Balanced · Classic",
    ing:[{n:"Ức gà",a:"200g"},{n:"Mù tạt Dijon",a:"1 tbsp"},{n:"Mật ong",a:"1 tbsp"},{n:"Tỏi",a:"2 tép"},{n:"Dầu olive",a:"1 tsp"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Trộn mù tạt + mật ong + tỏi băm thành sốt.","Phết sốt lên 2 mặt gà.","Áp chảo 6-7 phút mỗi mặt ở lửa vừa.","Rưới sốt còn lại lên khi dùng."] },

  { id:36, e:"🍷", n:"Gà áp chảo balsamic", cal:252, p:40, c:6, f:7, t:18, g:"Duy trì", tags:["Duy trì"], bg:"#EEE0E8", type:"food",
    health:"Balsamic polyphenol · Elegant · Italian",
    ing:[{n:"Ức gà",a:"200g"},{n:"Giấm balsamic",a:"3 tbsp"},{n:"Mật ong",a:"1 tsp"},{n:"Tỏi",a:"2 tép"},{n:"Dầu olive",a:"1 tsp"},{n:"Thyme",a:"1 tsp"}],
    steps:["Áp chảo gà 5 phút mỗi mặt.","Cho tỏi vào, xào 30 giây.","Đổ balsamic + mật ong + thyme vào chảo.","Đảo gà trong sốt 2 phút đến sánh."] },

  { id:37, e:"🌶️", n:"Gà áp chảo cajun", cal:248, p:42, c:3, f:7, t:15, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#F5E4DC", type:"food",
    health:"Cayenne metabolism · Bold flavor · Zero carb",
    ing:[{n:"Ức gà",a:"200g"},{n:"Gia vị cajun",a:"2 tsp"},{n:"Paprika khói",a:"1 tsp"},{n:"Tỏi bột",a:"½ tsp"},{n:"Dầu olive",a:"1 tsp"},{n:"Chanh",a:"½ quả"}],
    steps:["Trộn cajun + paprika + tỏi bột, xoa đều lên gà.","Để 10 phút.","Áp chảo dầu olive lửa vừa-cao 6 phút mỗi mặt.","Vắt chanh trước khi ăn."] },

  { id:38, e:"🥛", n:"Gà áp chảo sốt sữa chua thảo mộc", cal:242, p:41, c:5, f:6, t:18, g:"Giảm mỡ", tags:["Giảm mỡ"], bg:"#F0F0E8", type:"food",
    health:"Probiotic · Low fat · Protein cao",
    ing:[{n:"Ức gà",a:"200g"},{n:"Sữa chua Greek 0%",a:"4 tbsp"},{n:"Tỏi",a:"2 tép"},{n:"Dill tươi",a:"1 tbsp"},{n:"Chanh",a:"½ quả"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Trộn sữa chua + tỏi + dill + chanh + muối tiêu.","Ướp gà 20 phút.","Áp chảo không dầu 6-7 phút mỗi mặt.","Phết thêm sữa chua + dill tươi khi dùng."] },

  // ── 39-46: BOWL / CƠM ──
  { id:39, e:"🍚", n:"Cơm gà Hải Nam healthy", cal:390, p:44, c:38, f:7, t:35, g:"Tăng cơ", tags:["Tăng cơ","Meal prep"], bg:"#F5EDDA", type:"food",
    health:"Complete meal · Gừng kháng viêm · Classic",
    ing:[{n:"Ức gà",a:"180g"},{n:"Gạo hạt dài",a:"80g"},{n:"Gừng",a:"3 lát"},{n:"Hành tây",a:"¼ củ"},{n:"Nước tương",a:"1 tbsp"},{n:"Hành lá, dưa leo",a:"để garnish"}],
    steps:["Luộc gà với gừng + hành tây 20 phút trong nước sôi nhẹ.","Dùng nước luộc gà nấu cơm — thơm hơn.","Thái gà mỏng theo thớ.","Dọn cơm + gà + dưa leo + nước tương."] },

  { id:40, e:"🍜", n:"Bowl gà teriyaki gạo lứt", cal:410, p:46, c:40, f:7, t:30, g:"Tăng cơ", tags:["Tăng cơ","Meal prep"], bg:"#EEE8D8", type:"food",
    health:"Whole grain · High protein · Meal prep",
    ing:[{n:"Ức gà",a:"180g"},{n:"Gạo lứt",a:"80g"},{n:"Edamame",a:"50g"},{n:"Bơ",a:"¼ quả"},{n:"Cà rốt thái sợi",a:"50g"},{n:"Sốt teriyaki healthy",a:"2 tbsp"}],
    steps:["Nấu gạo lứt 25 phút.","Áp chảo gà, đổ sốt teriyaki vào sau 3 phút cuối.","Luộc edamame 3 phút.","Xếp cơm + gà + rau củ + bơ vào bowl."] },

  { id:41, e:"🥬", n:"Bowl gà cải xoăn quinoa", cal:360, p:43, c:30, f:8, t:25, g:"Giảm mỡ", tags:["Giảm mỡ","Meal prep"], bg:"#E4EEE4", type:"food",
    health:"Kale superfood · Iron · Vitamin K",
    ing:[{n:"Ức gà nướng",a:"150g"},{n:"Quinoa",a:"60g"},{n:"Cải xoăn kale",a:"80g"},{n:"Hạt bí ngô",a:"1 tbsp"},{n:"Dầu olive",a:"1 tsp"},{n:"Giấm táo",a:"1 tsp"}],
    steps:["Nấu quinoa 15 phút.","Nướng gà, thái lát.","Tẩm dầu olive + giấm vào kale, massage nhẹ.","Xếp quinoa + kale + gà + hạt bí vào bowl."] },

  { id:42, e:"🍳", n:"Cơm chiên gà trứng healthy", cal:380, p:42, c:32, f:8, t:20, g:"Tăng cơ", tags:["Tăng cơ","<15 phút"], bg:"#FAF0E0", type:"food",
    health:"Complete amino acid · Quick · High protein",
    ing:[{n:"Ức gà luộc xé sợi",a:"150g"},{n:"Cơm trắng nguội",a:"150g"},{n:"Trứng",a:"2 quả"},{n:"Hành lá",a:"3 nhánh"},{n:"Nước tương",a:"1 tbsp"},{n:"Dầu olive",a:"1 tsp"}],
    steps:["Đun nóng chảo với dầu olive.","Cho trứng đánh vào, scramble nhanh.","Thêm cơm nguội, đảo đều.","Cho gà + nước tương + hành lá, đảo 2 phút."] },

  { id:43, e:"🫙", n:"Bowl gà Mediterranean", cal:350, p:42, c:22, f:9, t:20, g:"Duy trì", tags:["Duy trì","<15 phút"], bg:"#E8EEF0", type:"food",
    health:"Mediterranean diet · Polyphenol · Heart health",
    ing:[{n:"Ức gà nướng",a:"150g"},{n:"Hummus",a:"3 tbsp"},{n:"Cà chua bi",a:"100g"},{n:"Dưa leo",a:"1 quả"},{n:"Oliu",a:"10 hạt"},{n:"Feta ít béo",a:"20g"}],
    steps:["Nướng gà, thái lát.","Phết hummus xuống đáy bát.","Xếp gà + cà chua + dưa leo + oliu.","Rắc feta, rưới dầu olive + muối tiêu."] },

  { id:44, e:"🌾", n:"Cơm gạo lứt gà rang muối", cal:370, p:44, c:36, f:6, t:30, g:"Tăng cơ", tags:["Tăng cơ"], bg:"#F2EDDA", type:"food",
    health:"Whole grain · Fiber · Clean bulk",
    ing:[{n:"Ức gà",a:"180g"},{n:"Gạo lứt",a:"80g"},{n:"Muối hồng",a:"1 tsp"},{n:"Tiêu đen",a:"1 tsp"},{n:"Tỏi bột",a:"½ tsp"},{n:"Dầu mè",a:"½ tsp"}],
    steps:["Nấu gạo lứt 25 phút.","Xoa gà với muối hồng + tiêu + tỏi bột.","Áp chảo gà không dầu 12 phút.","Dùng cơm gạo lứt + gà + dưa leo tươi."] },

  { id:45, e:"🌮", n:"Bowl gà chipotle", cal:360, p:43, c:25, f:8, t:25, g:"Giảm mỡ", tags:["Giảm mỡ"], bg:"#F5E8E0", type:"food",
    health:"Smoky · Capsaicin · High protein",
    ing:[{n:"Ức gà",a:"180g"},{n:"Ớt chipotle",a:"1 tbsp"},{n:"Cơm gạo lứt",a:"100g"},{n:"Đậu đen",a:"50g"},{n:"Salsa cà chua",a:"3 tbsp"},{n:"Rau xà lách",a:"50g"}],
    steps:["Ướp gà với chipotle + muối + cumin 15 phút.","Nướng hoặc áp chảo gà 12 phút.","Hâm nóng đậu đen.","Xếp cơm + gà + đậu + salsa + rau vào bowl."] },

  { id:46, e:"🇰🇷", n:"Bibimbap gà healthy", cal:390, p:44, c:38, f:7, t:30, g:"Tăng cơ", tags:["Tăng cơ"], bg:"#F5E4E4", type:"food",
    health:"Korean superfood · Fermented · Balanced",
    ing:[{n:"Ức gà",a:"150g"},{n:"Cơm gạo lứt",a:"120g"},{n:"Giá đỗ",a:"50g"},{n:"Cà rốt thái sợi",a:"50g"},{n:"Bí xanh",a:"50g"},{n:"Gochujang nhẹ",a:"1 tsp"}],
    steps:["Nấu cơm gạo lứt.","Xào riêng từng loại rau với chút dầu mè.","Áp chảo gà thái lát.","Xếp cơm giữa bát, rau xung quanh, gà lên trên, thêm gochujang."] },

  // ── 47-54: SALAD ──
  { id:47, e:"🥗", n:"Salad gà Caesar healthy", cal:230, p:36, c:8, f:8, t:15, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#E8F0E4", type:"food",
    health:"Vitamin K · Calcium · Classic làm lại healthy",
    ing:[{n:"Ức gà nướng",a:"150g"},{n:"Xà lách romaine",a:"100g"},{n:"Parmesan bào",a:"15g"},{n:"Sữa chua Greek 0%",a:"3 tbsp"},{n:"Tỏi",a:"1 tép"},{n:"Chanh",a:"½ quả"}],
    steps:["Trộn sữa chua + tỏi + chanh + parmesan làm dressing Caesar nhẹ.","Nướng gà, thái lát.","Xé rau romaine, xếp ra đĩa.","Xếp gà lên, rưới dressing, rắc thêm parmesan."] },

  { id:48, e:"🥭", n:"Salad gà xoài nhiệt đới", cal:220, p:34, c:14, f:5, t:12, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#FAF0DC", type:"food",
    health:"Tropical · Vitamin C · Fresh",
    ing:[{n:"Ức gà luộc",a:"150g"},{n:"Xoài chín",a:"100g"},{n:"Rau rocket",a:"50g"},{n:"Hành tây tím",a:"¼ củ"},{n:"Chanh + dầu olive",a:"1 tbsp mỗi"},{n:"Rau mùi",a:"1 ít"}],
    steps:["Luộc gà, xé sợi.","Thái xoài hạt lựu, hành tây tím mỏng.","Trộn chanh + dầu olive + muối tiêu.","Toss tất cả với rau, rắc rau mùi."] },

  { id:49, e:"🥑", n:"Salad gà bơ", cal:290, p:35, c:6, f:16, t:12, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#E4EEE0", type:"food",
    health:"Healthy fat · Omega-9 · Satiating",
    ing:[{n:"Ức gà luộc",a:"150g"},{n:"Bơ",a:"½ quả"},{n:"Cà chua bi",a:"80g"},{n:"Rau spinach",a:"60g"},{n:"Dầu olive",a:"1 tbsp"},{n:"Chanh + muối tiêu",a:"vừa đủ"}],
    steps:["Luộc gà xé sợi.","Cắt bơ hạt lựu, cà chua đôi.","Trộn dầu olive + chanh + muối tiêu.","Toss tất cả nhẹ nhàng, dùng ngay."] },

  { id:50, e:"🍈", n:"Salad gà dưa gang bạc hà", cal:200, p:33, c:10, f:4, t:10, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#E8F0E8", type:"food",
    health:"Hydrating · Refreshing · Summer",
    ing:[{n:"Ức gà luộc",a:"150g"},{n:"Dưa gang",a:"150g"},{n:"Bạc hà tươi",a:"10 lá"},{n:"Rau arugula",a:"50g"},{n:"Chanh",a:"½ quả"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Luộc gà, để nguội xé sợi.","Thái dưa gang miếng nhỏ.","Xé nhỏ bạc hà.","Trộn tất cả + vắt chanh + muối tiêu."] },

  { id:51, e:"🍎", n:"Salad gà táo óc chó", cal:260, p:34, c:12, f:10, t:12, g:"Duy trì", tags:["Duy trì","<15 phút"], bg:"#F5E8E0", type:"food",
    health:"Omega-3 óc chó · Polyphenol táo · Brain food",
    ing:[{n:"Ức gà nướng",a:"150g"},{n:"Táo đỏ",a:"1 quả"},{n:"Óc chó",a:"20g"},{n:"Rau spinach",a:"60g"},{n:"Giấm táo",a:"1 tbsp"},{n:"Dầu olive",a:"1 tsp"}],
    steps:["Nướng gà, thái mỏng.","Thái lát táo mỏng, đập vụn óc chó.","Trộn giấm táo + dầu olive + muối tiêu.","Toss tất cả cùng rau spinach."] },

  { id:52, e:"🫐", n:"Salad gà nho xanh", cal:235, p:34, c:13, f:6, t:10, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#E4EAE4", type:"food",
    health:"Resveratrol · Anti-aging · Fresh flavor",
    ing:[{n:"Ức gà luộc",a:"150g"},{n:"Nho xanh không hạt",a:"80g"},{n:"Rau arugula",a:"60g"},{n:"Hạnh nhân lát",a:"15g"},{n:"Giấm balsamic",a:"1 tbsp"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Luộc gà xé sợi.","Cắt đôi nho.","Nướng khô hạnh nhân lát 2 phút.","Trộn tất cả + giấm balsamic + muối tiêu."] },

  { id:53, e:"🥝", n:"Salad gà kiwi chanh leo", cal:210, p:33, c:11, f:4, t:10, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#E4EEE4", type:"food",
    health:"Vitamin C gấp đôi cam · Enzyme tiêu hóa · Collagen",
    ing:[{n:"Ức gà luộc",a:"150g"},{n:"Kiwi",a:"2 quả"},{n:"Chanh leo",a:"1 quả"},{n:"Rau xà lách",a:"60g"},{n:"Mật ong",a:"1 tsp"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Luộc gà, xé sợi.","Kiwi gọt vỏ thái lát.","Trộn nước chanh leo + mật ong + muối làm dressing.","Xếp rau + gà + kiwi, rưới dressing."] },

  { id:54, e:"🫑", n:"Salad gà ớt chuông 3 màu", cal:215, p:35, c:9, f:5, t:12, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#F0EEE0", type:"food",
    health:"Capsanthin · Vitamin C cao · Colorful",
    ing:[{n:"Ức gà nướng",a:"150g"},{n:"Ớt chuông đỏ + vàng + xanh",a:"½ mỗi loại"},{n:"Hành tây",a:"¼ củ"},{n:"Dầu olive",a:"1 tbsp"},{n:"Giấm táo",a:"1 tbsp"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Nướng gà, thái lát.","Thái ớt chuông và hành tây mỏng.","Trộn dầu olive + giấm táo + muối tiêu.","Toss tất cả, dùng ngay hoặc để lạnh."] },

  // ── 55-62: CANH / SOUP ──
  { id:55, e:"🥣", n:"Canh gà cải xanh gừng", cal:190, p:38, c:4, f:4, t:20, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#E4EEE4", type:"food",
    health:"Zero fat · Detox · Kháng viêm",
    ing:[{n:"Ức gà",a:"150g"},{n:"Cải xanh",a:"150g"},{n:"Gừng",a:"3 lát"},{n:"Nước dùng gà",a:"400ml"},{n:"Muối, tiêu",a:"vừa đủ"},{n:"Hành lá",a:"2 nhánh"}],
    steps:["Thái mỏng gà.","Đun sôi nước dùng + gừng.","Cho gà vào nấu 8 phút.","Thêm cải xanh, nấu thêm 3 phút, nêm muối tiêu."] },

  { id:56, e:"🍜", n:"Canh gà miso rau", cal:200, p:38, c:6, f:4, t:15, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#EDE8DC", type:"food",
    health:"Probiotic miso · Gut health · Umami",
    ing:[{n:"Ức gà",a:"150g"},{n:"Miso trắng",a:"1.5 tbsp"},{n:"Đậu hũ non",a:"100g"},{n:"Rong biển",a:"5g"},{n:"Nước",a:"400ml"},{n:"Hành lá",a:"2 nhánh"}],
    steps:["Đun sôi nước, thêm gà thái mỏng, nấu 8 phút.","Hòa miso với 3 tbsp nước canh.","Thêm đậu hũ + rong biển.","Tắt bếp, đổ miso vào, rắc hành lá."] },

  { id:57, e:"🎃", n:"Súp gà bí đỏ cà ri", cal:240, p:36, c:15, f:6, t:30, g:"Duy trì", tags:["Duy trì"], bg:"#F5EAD8", type:"food",
    health:"Beta-carotene · Warming · Fiber",
    ing:[{n:"Ức gà",a:"150g"},{n:"Bí đỏ",a:"200g"},{n:"Bột cà ri",a:"1.5 tsp"},{n:"Nước cốt dừa light",a:"100ml"},{n:"Hành tây",a:"½ củ"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Xào hành tây + cà ri đến thơm.","Cho gà vào xào 3 phút.","Thêm bí đỏ + nước cốt dừa + 200ml nước.","Nấu 20 phút đến bí mềm, xay mịn hoặc để nguyên."] },

  { id:58, e:"🍄", n:"Canh gà nấm kim châm", cal:195, p:37, c:5, f:4, t:18, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#EDE8E0", type:"food",
    health:"Beta-glucan · Immune · Thấp calo",
    ing:[{n:"Ức gà",a:"150g"},{n:"Nấm kim châm",a:"100g"},{n:"Gừng",a:"2 lát"},{n:"Nước dùng gà",a:"400ml"},{n:"Nước tương",a:"1 tbsp"},{n:"Hành lá",a:"2 nhánh"}],
    steps:["Đun nước dùng + gừng sôi.","Thêm gà thái mỏng, nấu 8 phút.","Thêm nấm kim châm + nước tương.","Nấu thêm 3 phút, rắc hành lá."] },

  { id:59, e:"🥥", n:"Súp gà cà ri Thái", cal:270, p:38, c:10, f:9, t:25, g:"Duy trì", tags:["Duy trì"], bg:"#F5EDDA", type:"food",
    health:"Coconut MCT · Thai herbs · Anti-inflammation",
    ing:[{n:"Ức gà",a:"150g"},{n:"Nước cốt dừa light",a:"150ml"},{n:"Cà ri đỏ Thái",a:"1 tbsp"},{n:"Sả + lá chanh",a:"2 cây + 3 lá"},{n:"Nước mắm",a:"1 tbsp"},{n:"Chanh",a:"½ quả"}],
    steps:["Xào cà ri Thái với 2 tbsp nước cốt dừa đến thơm.","Thêm gà thái, xào 3 phút.","Đổ nước cốt dừa còn lại + sả + lá chanh.","Nấu 15 phút, nêm nước mắm + chanh."] },

  { id:60, e:"🍜", n:"Phở gà healthy", cal:310, p:40, c:28, f:5, t:30, g:"Duy trì", tags:["Duy trì"], bg:"#F5EDDA", type:"food",
    health:"Traditional · Collagen từ nước dùng · Warming",
    ing:[{n:"Ức gà",a:"150g"},{n:"Bún phở",a:"80g"},{n:"Nước dùng gà",a:"500ml"},{n:"Hồi, quế, đinh hương",a:"gia vị phở"},{n:"Hành + gừng nướng",a:"vừa đủ"},{n:"Giá + rau thơm",a:"để kèm"}],
    steps:["Nướng hành + gừng cho thơm, cho vào nước dùng cùng gia vị phở.","Đun sôi 20 phút, lọc bỏ xác.","Luộc gà trong nước dùng 15 phút, thái mỏng.","Chan nước dùng nóng lên bún + gà + giá."] },

  { id:61, e:"🍲", n:"Bún gà sả ớt", cal:320, p:40, c:30, f:5, t:25, g:"Duy trì", tags:["Duy trì"], bg:"#F5EAE0", type:"food",
    health:"Vietnamese · Lemongrass digestive · Spicy metabolism",
    ing:[{n:"Ức gà",a:"150g"},{n:"Bún tươi",a:"100g"},{n:"Sả",a:"3 cây"},{n:"Ớt",a:"2 quả"},{n:"Nước mắm",a:"2 tbsp"},{n:"Rau thơm các loại",a:"vừa đủ"}],
    steps:["Đun sôi nước với sả đập dập + ớt.","Cho gà vào nấu 15-18 phút.","Vớt gà xé sợi, nêm nước mắm.","Chan nước sốt lên bún + gà + rau thơm."] },

  { id:62, e:"🫕", n:"Súp gà khoai lang sweet potato", cal:250, p:37, c:16, f:5, t:28, g:"Tăng cơ", tags:["Tăng cơ"], bg:"#F7EDDA", type:"food",
    health:"Beta-carotene · Post-workout · Warming",
    ing:[{n:"Ức gà",a:"150g"},{n:"Khoai lang",a:"150g"},{n:"Hành tây",a:"½ củ"},{n:"Tỏi",a:"3 tép"},{n:"Nước dùng",a:"400ml"},{n:"Muối, tiêu, thyme",a:"vừa đủ"}],
    steps:["Xào hành tây + tỏi đến thơm.","Cho gà + khoai lang vào, đổ nước dùng.","Nấu 20 phút đến khoai mềm.","Xay một nửa súp để súp đặc, nêm muối tiêu thyme."] },

  // ── 63-70: WRAP / CUỘN ──
  { id:63, e:"🫚", n:"Gà cuộn bánh tráng rau sống", cal:250, p:38, c:18, f:5, t:15, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#F0EEE8", type:"food",
    health:"Fresh · Low carb · Vietnamese style",
    ing:[{n:"Ức gà luộc",a:"150g"},{n:"Bánh tráng",a:"4 tờ"},{n:"Rau sống các loại",a:"100g"},{n:"Bún",a:"50g"},{n:"Cà rốt thái sợi",a:"50g"},{n:"Nước chấm ít đường",a:"3 tbsp"}],
    steps:["Luộc gà, xé sợi. Bún chần qua nước sôi.","Nhúng bánh tráng vào nước ấm.","Xếp rau + bún + gà + cà rốt lên bánh.","Cuộn chặt, chấm với nước chấm ít đường."] },

  { id:64, e:"🌯", n:"Gà burrito bowl healthy", cal:360, p:44, c:28, f:7, t:25, g:"Tăng cơ", tags:["Tăng cơ","Meal prep"], bg:"#F5E8E0", type:"food",
    health:"Complete meal · Mexican inspired · High protein",
    ing:[{n:"Ức gà",a:"180g"},{n:"Cơm gạo lứt",a:"100g"},{n:"Đậu đen",a:"60g"},{n:"Ngô",a:"50g"},{n:"Salsa",a:"3 tbsp"},{n:"Sữa chua Greek",a:"2 tbsp"}],
    steps:["Ướp gà cumin + paprika, áp chảo 12 phút.","Hâm nóng đậu đen + ngô.","Xếp cơm + gà + đậu + ngô vào bát.","Thêm salsa + sữa chua Greek thay sour cream."] },

  { id:65, e:"🥬", n:"Gà lettuce wrap keto", cal:195, p:38, c:4, f:5, t:12, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#E4EEE0", type:"food",
    health:"Zero carb · Keto · Crunchy fresh",
    ing:[{n:"Ức gà xé sợi",a:"150g"},{n:"Lá xà lách to",a:"6 lá"},{n:"Cà rốt thái sợi",a:"50g"},{n:"Gừng",a:"1 tsp"},{n:"Nước tương ít muối",a:"1 tbsp"},{n:"Mè rang",a:"1 tsp"}],
    steps:["Xé sợi gà đã luộc.","Trộn gà + cà rốt + gừng + nước tương.","Xếp hỗn hợp vào lá xà lách.","Rắc mè rang, gói lại và ăn ngay."] },

  { id:66, e:"🌮", n:"Gà taco kiểu Mexico healthy", cal:280, p:39, c:15, f:7, t:18, g:"Duy trì", tags:["Duy trì"], bg:"#F5E8D8", type:"food",
    health:"Mexican spice · Fiber cao · Balanced",
    ing:[{n:"Ức gà",a:"150g"},{n:"Vỏ taco ngũ cốc",a:"2 cái"},{n:"Salsa tươi",a:"3 tbsp"},{n:"Bắp cải tím thái sợi",a:"50g"},{n:"Sữa chua Greek",a:"2 tbsp"},{n:"Chanh + rau mùi",a:"vừa đủ"}],
    steps:["Ướp gà cumin + ớt + muối, áp chảo 10 phút.","Hâm vỏ taco trong lò 3 phút.","Thái gà nhỏ, xếp vào vỏ taco.","Thêm salsa + bắp cải + sữa chua + chanh."] },

  { id:67, e:"🥙", n:"Gà sandwich whole wheat", cal:320, p:38, c:24, f:7, t:10, g:"Tăng cơ", tags:["Tăng cơ","<15 phút"], bg:"#F2EDDA", type:"food",
    health:"Whole grain · Quick meal · High protein",
    ing:[{n:"Ức gà nướng",a:"150g"},{n:"Bánh mì whole wheat",a:"2 lát"},{n:"Mù tạt Dijon",a:"1 tsp"},{n:"Xà lách + cà chua",a:"vừa đủ"},{n:"Dưa leo thái lát",a:"vừa đủ"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Nướng gà, thái lát mỏng.","Phết mù tạt lên bánh mì.","Xếp gà + rau + dưa leo lên bánh.","Đậy bánh, ép nhẹ và dùng ngay."] },

  { id:68, e:"🫓", n:"Gà bánh mì Việt Nam healthy", cal:295, p:37, c:22, f:5, t:15, g:"Duy trì", tags:["Duy trì","<15 phút"], bg:"#F5EAD8", type:"food",
    health:"Vietnamese fusion · Probiotic · Fresh herbs",
    ing:[{n:"Ức gà nướng",a:"130g"},{n:"Bánh mì ngũ cốc",a:"1 ổ nhỏ"},{n:"Đồ chua cà rốt củ cải",a:"50g"},{n:"Rau mùi + dưa leo",a:"vừa đủ"},{n:"Nước tương + tương ớt",a:"1 tsp mỗi"},{n:"Sữa chua Greek",a:"1 tbsp"}],
    steps:["Nướng bánh mì cho giòn.","Phết sữa chua Greek thay bơ.","Xếp gà + đồ chua + rau mùi + dưa leo.","Rưới nước tương + tương ớt."] },

  { id:69, e:"🫙", n:"Gà cuộn rau củ", cal:230, p:38, c:8, f:5, t:20, g:"Giảm mỡ", tags:["Giảm mỡ","Meal prep"], bg:"#E8EEE4", type:"food",
    health:"Low carb · Colorful · Meal prep",
    ing:[{n:"Ức gà mỏng",a:"200g"},{n:"Ớt chuông thái dài",a:"100g"},{n:"Bí xanh thái dài",a:"100g"},{n:"Phô mai mozzarella ít béo",a:"20g"},{n:"Muối, tiêu, tỏi bột",a:"vừa đủ"},{n:"Dầu olive",a:"1 tsp"}],
    steps:["Đập mỏng gà, ướp muối tiêu tỏi bột.","Xếp rau củ + phô mai lên mặt gà.","Cuộn chặt, dùng tăm ghim lại.","Nướng 200°C 20 phút đến vàng đều."] },

  { id:70, e:"🫑", n:"Gà nhồi ớt chuông", cal:245, p:38, c:10, f:6, t:30, g:"Tăng cơ", tags:["Tăng cơ"], bg:"#F0EEE0", type:"food",
    health:"Capsaicin · Vitamin C cao · Creative",
    ing:[{n:"Ức gà xay",a:"180g"},{n:"Ớt chuông to",a:"2 quả"},{n:"Hành tây",a:"¼ củ"},{n:"Cà chua thái nhỏ",a:"50g"},{n:"Phô mai ít béo",a:"20g"},{n:"Muối, tiêu, oregano",a:"vừa đủ"}],
    steps:["Cắt đỉnh ớt chuông, bỏ hạt.","Trộn gà xay + hành + cà chua + muối tiêu oregano.","Nhồi hỗn hợp vào ớt chuông, phủ phô mai.","Nướng 200°C 25-28 phút."] },

  // ── 71-78: ĐẶC BIỆT ──
  { id:71, e:"🇹🇭", n:"Gà larb kiểu Thái", cal:220, p:37, c:6, f:5, t:15, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#EAEEDC", type:"food",
    health:"Fresh herbs · Light · Thai authentic",
    ing:[{n:"Ức gà xay hoặc băm",a:"180g"},{n:"Sả băm",a:"1 cây"},{n:"Lá chanh thái sợi",a:"4 lá"},{n:"Nước mắm",a:"1 tbsp"},{n:"Chanh",a:"1 quả"},{n:"Bạc hà + rau mùi",a:"1 nắm"}],
    steps:["Xào gà băm không dầu đến chín.","Để nguội, trộn với sả + lá chanh.","Trộn nước mắm + chanh làm dressing.","Toss với rau thơm, dùng với rau sống."] },

  { id:72, e:"🥘", n:"Gà tikka masala light", cal:280, p:40, c:12, f:7, t:30, g:"Duy trì", tags:["Duy trì"], bg:"#F5E4D0", type:"food",
    health:"Turmeric · Anti-inflammation · Indian classic",
    ing:[{n:"Ức gà",a:"180g"},{n:"Sữa chua Greek 0%",a:"100g"},{n:"Cà chua xay",a:"100g"},{n:"Gia vị tikka masala",a:"2 tsp"},{n:"Hành tây",a:"½ củ"},{n:"Muối, tỏi",a:"vừa đủ"}],
    steps:["Ướp gà với sữa chua + gia vị tikka 30 phút.","Xào hành tây + tỏi đến thơm.","Thêm cà chua xay + gà, nấu 20 phút.","Dùng với cơm gạo lứt hoặc bánh naan nhỏ."] },

  { id:73, e:"🥢", n:"Gà yakitori", cal:230, p:40, c:6, f:5, t:20, g:"Giảm mỡ", tags:["Giảm mỡ"], bg:"#F2E8D8", type:"food",
    health:"Japanese style · Tare sauce · Low fat",
    ing:[{n:"Ức gà",a:"200g"},{n:"Nước tương ít muối",a:"2 tbsp"},{n:"Mirin",a:"1 tbsp"},{n:"Sake/nước",a:"1 tbsp"},{n:"Đường thốt nốt",a:"½ tsp"},{n:"Hành lá",a:"3 nhánh"}],
    steps:["Pha sốt tare: nước tương + mirin + sake + đường thốt nốt, đun đến sánh.","Thái gà miếng vừa, xiên vào que tre.","Nướng grill phết sốt liên tục 12 phút.","Rắc hành lá thái xéo."] },

  { id:74, e:"🥜", n:"Gà satay protein", cal:265, p:40, c:8, f:7, t:25, g:"Tăng cơ", tags:["Tăng cơ"], bg:"#F5E8D4", type:"food",
    health:"Peanut protein · Southeast Asian · Satisfying",
    ing:[{n:"Ức gà",a:"200g"},{n:"Bơ đậu phộng tự nhiên",a:"1 tbsp"},{n:"Nước cốt dừa light",a:"2 tbsp"},{n:"Nước tương",a:"1 tbsp"},{n:"Nghệ",a:"½ tsp"},{n:"Chanh",a:"½ quả"}],
    steps:["Trộn bơ đậu phộng + nước cốt dừa + nước tương + nghệ.","Ướp gà 20 phút.","Xiên que, nướng grill 12-14 phút.","Dùng với sốt đậu phộng còn lại + chanh."] },

  { id:75, e:"🍝", n:"Gà pasta zucchini healthy", cal:310, p:40, c:18, f:7, t:20, g:"Duy trì", tags:["Duy trì","<15 phút"], bg:"#E8EEE0", type:"food",
    health:"Low carb pasta · Zucchini fiber · Italian",
    ing:[{n:"Ức gà",a:"150g"},{n:"Bí xanh",a:"2 quả (xoắn thành sợi)"},{n:"Tỏi",a:"3 tép"},{n:"Cà chua bi",a:"100g"},{n:"Dầu olive",a:"1.5 tsp"},{n:"Rau quế, muối tiêu",a:"vừa đủ"}],
    steps:["Xoắn bí xanh thành sợi bằng dụng cụ hoặc bào thô.","Áp chảo gà 10 phút, thái lát.","Xào tỏi + cà chua + bí xanh 3 phút.","Thêm gà + rau quế + muối tiêu."] },

  { id:76, e:"🫛", n:"Gà xào đậu edamame", cal:295, p:42, c:12, f:7, t:15, g:"Tăng cơ", tags:["Tăng cơ","<15 phút"], bg:"#E4EEE0", type:"food",
    health:"Complete plant + animal protein · Iron · Quick",
    ing:[{n:"Ức gà",a:"150g"},{n:"Edamame luộc",a:"80g"},{n:"Tỏi",a:"2 tép"},{n:"Gừng",a:"1 tsp"},{n:"Nước tương",a:"1 tbsp"},{n:"Dầu mè",a:"1 tsp"}],
    steps:["Thái gà miếng nhỏ, ướp nước tương 5 phút.","Làm nóng chảo với dầu mè.","Xào gà + tỏi + gừng 5 phút.","Thêm edamame, đảo 2 phút."] },

  { id:77, e:"🧆", n:"Gà cuốn lá nho", cal:240, p:36, c:8, f:6, t:25, g:"Giảm mỡ", tags:["Giảm mỡ"], bg:"#E4EEE4", type:"food",
    health:"Mediterranean · Antioxidant lá nho · Elegant",
    ing:[{n:"Ức gà xay",a:"180g"},{n:"Lá nho",a:"10 lá"},{n:"Gạo lứt nấu sẵn",a:"3 tbsp"},{n:"Rau mùi tây băm",a:"2 tbsp"},{n:"Chanh",a:"½ quả"},{n:"Muối, tiêu, allspice",a:"vừa đủ"}],
    steps:["Trộn gà xay + gạo lứt + rau mùi + muối tiêu + allspice.","Đặt 1 tbsp nhân lên lá nho, cuộn chặt.","Xếp vào nồi, thêm nước chanh + nước.","Hấp 20-22 phút đến chín."] },

  { id:78, e:"🫕", n:"Gà one-pan rau củ nướng", cal:285, p:40, c:14, f:7, t:30, g:"Duy trì", tags:["Duy trì","Meal prep"], bg:"#F0EEE0", type:"food",
    health:"One-pan easy · Fiber cao · Meal prep",
    ing:[{n:"Ức gà",a:"180g"},{n:"Bông cải xanh",a:"100g"},{n:"Cà rốt",a:"80g"},{n:"Ớt chuông",a:"80g"},{n:"Dầu olive",a:"1.5 tsp"},{n:"Muối, tiêu, tỏi bột",a:"vừa đủ"}],
    steps:["Cắt rau củ miếng vừa, trộn dầu olive + muối + tiêu + tỏi bột.","Xếp gà + rau củ lên khay nướng.","Nướng 200°C 25-28 phút.","Dùng nóng hoặc để meal prep 4 ngày."] },

  // ── 79-87: SMOOTHIE MỚI ──
  { id:79, e:"🍓", n:"Smoothie Dâu Tây Protein", cal:275, p:35, c:22, f:4, t:5, g:"Sinh tố", tags:["Sinh tố","Giảm mỡ","<15 phút"], bg:"#F5E4E4", type:"smoothie",
    health:"Anthocyanin · Vitamin C · Post-workout",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Dâu tây đông lạnh",a:"120g"},{n:"Sữa chua Greek 0%",a:"150g"},{n:"Sữa hạnh nhân",a:"150ml"},{n:"Mật ong",a:"1 tsp"},{n:"Hạt lanh",a:"1 tsp"}],
    steps:["Gà luộc để nguội trong tủ lạnh.","Cho sữa hạnh nhân + gà + dâu + sữa chua + mật ong vào máy xay.","Xay 60 giây đến mịn.","Rắc hạt lanh lên mặt."] },

  { id:80, e:"🍫", n:"Smoothie Socola Protein", cal:330, p:38, c:25, f:7, t:5, g:"Sinh tố", tags:["Sinh tố","Tăng cơ","<15 phút"], bg:"#EEE0D8", type:"smoothie",
    health:"Cacao antioxidant · Mood boost · Post-workout",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Chuối đông lạnh",a:"1 quả"},{n:"Bột cacao không đường",a:"1.5 tbsp"},{n:"Sữa hạnh nhân",a:"250ml"},{n:"Bơ đậu phộng tự nhiên",a:"1 tsp"},{n:"Đá",a:"5 viên"}],
    steps:["Cho sữa hạnh nhân vào máy xay trước.","Thêm gà + chuối + cacao + bơ đậu phộng + đá.","Xay 60 giây đến mịn bóng.","Uống ngay sau tập."] },

  { id:81, e:"🥦", n:"Smoothie Xanh Detox", cal:240, p:33, c:12, f:5, t:5, g:"Sinh tố", tags:["Sinh tố","Giảm mỡ","<15 phút"], bg:"#E0EEE4", type:"smoothie",
    health:"Chlorophyll · Detox · Alkaline",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Rau bina",a:"60g"},{n:"Cần tây",a:"2 cây"},{n:"Dưa leo",a:"½ quả"},{n:"Táo xanh",a:"½ quả"},{n:"Sữa hạnh nhân",a:"200ml"}],
    steps:["Rửa sạch rau, cắt khúc.","Cho sữa vào máy xay trước.","Thêm gà + tất cả rau + táo.","Xay 90 giây đến hoàn toàn mịn."] },

  { id:82, e:"🥜", n:"Smoothie Bơ Đậu Phộng Protein", cal:355, p:40, c:18, f:12, t:5, g:"Sinh tố", tags:["Sinh tố","Tăng cơ","<15 phút"], bg:"#F5EAD8", type:"smoothie",
    health:"Healthy fat · Satiating · Bulk friendly",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Chuối",a:"1 quả"},{n:"Bơ đậu phộng tự nhiên",a:"1.5 tbsp"},{n:"Sữa hạnh nhân",a:"250ml"},{n:"Mật ong",a:"1 tsp"},{n:"Quế",a:"¼ tsp"}],
    steps:["Gà luộc nguội, cắt nhỏ.","Cho sữa + gà + chuối + bơ đậu phộng + mật ong + quế.","Xay 60 giây.","Uống ngay — không để quá lâu sẽ bị oxy hóa."] },

  { id:83, e:"🍊", n:"Smoothie Cam Gừng Protein", cal:255, p:33, c:18, f:4, t:5, g:"Sinh tố", tags:["Sinh tố","Giảm mỡ","<15 phút"], bg:"#FAF0E0", type:"smoothie",
    health:"Vitamin C · Immune boost · Gừng kháng viêm",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Cam tươi",a:"1 quả"},{n:"Gừng tươi",a:"1 lát"},{n:"Nghệ",a:"¼ tsp"},{n:"Sữa hạnh nhân",a:"200ml"},{n:"Đá",a:"5 viên"}],
    steps:["Vắt nước cam, gừng gọt vỏ.","Cho sữa + gà + nước cam + gừng + nghệ + đá.","Xay 60 giây.","Thêm tiêu đen vào để tăng hấp thu curcumin."] },

  { id:84, e:"🍉", n:"Smoothie Dưa Hấu Bạc Hà", cal:215, p:30, c:18, f:3, t:5, g:"Sinh tố", tags:["Sinh tố","Giảm mỡ","<15 phút"], bg:"#EAF0E8", type:"smoothie",
    health:"Hydrating · Lycopene · Summer refresh",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Dưa hấu đông lạnh",a:"150g"},{n:"Bạc hà tươi",a:"10 lá"},{n:"Sữa hạnh nhân",a:"150ml"},{n:"Chanh",a:"½ quả"},{n:"Đá",a:"5 viên"}],
    steps:["Dưa hấu đông lạnh tạo độ đặc, không cần đá nhiều.","Cho sữa + gà + dưa hấu + bạc hà + chanh.","Xay 45 giây đến mịn.","Uống ngay — màu đỏ đẹp từ lycopene."] },

  { id:85, e:"🍵", n:"Smoothie Matcha Protein", cal:280, p:35, c:16, f:6, t:5, g:"Sinh tố", tags:["Sinh tố","Giảm mỡ","<15 phút"], bg:"#E4EEE0", type:"smoothie",
    health:"L-theanine · Antioxidant · Calm energy",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Bột matcha",a:"1 tsp"},{n:"Sữa hạnh nhân",a:"250ml"},{n:"Chuối đông lạnh",a:"½ quả"},{n:"Mật ong",a:"1 tsp"},{n:"Đá",a:"5 viên"}],
    steps:["Hòa matcha với 2 tbsp sữa ấm để không bị vón.","Cho sữa còn lại + gà + chuối + mật ong + đá vào máy xay.","Thêm matcha đã hòa vào.","Xay 60 giây đến mịn."] },

  { id:86, e:"🌺", n:"Smoothie Thanh Long Đỏ", cal:235, p:32, c:20, f:4, t:5, g:"Sinh tố", tags:["Sinh tố","Giảm mỡ","<15 phút"], bg:"#F5E0EC", type:"smoothie",
    health:"Betalain antioxidant · Prebiotic · Colorful",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Thanh long đỏ",a:"150g"},{n:"Sữa chua Greek 0%",a:"100g"},{n:"Sữa hạnh nhân",a:"150ml"},{n:"Chanh",a:"½ quả"},{n:"Đá",a:"5 viên"}],
    steps:["Bóc vỏ thanh long, cắt khúc.","Cho sữa hạnh nhân + gà + thanh long + sữa chua + chanh + đá.","Xay 60 giây — màu đỏ tím rất đẹp.","Uống ngay trong ngày."] },

  { id:87, e:"🥥", n:"Smoothie Dừa Protein Nhiệt Đới", cal:305, p:35, c:20, f:9, t:5, g:"Sinh tố", tags:["Sinh tố","Tăng cơ","<15 phút"], bg:"#F5F0E8", type:"smoothie",
    health:"MCT coconut · Tropical · Energy boost",
    ing:[{n:"Ức gà luộc nguội",a:"100g"},{n:"Nước cốt dừa light",a:"150ml"},{n:"Dứa đông lạnh",a:"80g"},{n:"Xoài đông lạnh",a:"80g"},{n:"Sữa hạnh nhân",a:"100ml"},{n:"Hạt chia",a:"1 tsp"}],
    steps:["Cho sữa hạnh nhân + nước cốt dừa + gà vào máy xay.","Thêm dứa + xoài đông lạnh.","Xay 60 giây.","Rắc hạt chia, uống ngay."] },

  // ── 88-98: MÓN THÊM ──
  { id:88, e:"🫚", n:"Gà baked parmesan ít béo", cal:265, p:42, c:5, f:7, t:25, g:"Tăng cơ", tags:["Tăng cơ","Nướng"], bg:"#FAF0E0", type:"food",
    health:"Calcium từ parmesan · Crust giòn · No frying",
    ing:[{n:"Ức gà",a:"200g"},{n:"Parmesan bào",a:"20g"},{n:"Tỏi bột",a:"½ tsp"},{n:"Oregano",a:"1 tsp"},{n:"Muối, tiêu",a:"vừa đủ"},{n:"Dầu olive",a:"1 tsp"}],
    steps:["Trộn parmesan + tỏi bột + oregano + muối tiêu.","Phết dầu olive lên gà, áo đều hỗn hợp parmesan.","Nướng 200°C 22-25 phút đến vàng giòn.","Dùng với salad xanh."] },

  { id:89, e:"🇯🇵", n:"Gà teriyaki áp chảo nhanh", cal:270, p:41, c:10, f:6, t:15, g:"Duy trì", tags:["Duy trì","<15 phút"], bg:"#EEE8D8", type:"food",
    health:"Quick · Umami · Japanese style",
    ing:[{n:"Ức gà",a:"200g"},{n:"Nước tương ít muối",a:"1.5 tbsp"},{n:"Mirin",a:"1 tbsp"},{n:"Mật ong",a:"1 tsp"},{n:"Tỏi",a:"2 tép"},{n:"Mè rang",a:"1 tsp"}],
    steps:["Đập mỏng gà, ướp muối tiêu.","Áp chảo không dầu 5 phút mỗi mặt.","Pha nước tương + mirin + mật ong, đổ vào chảo.","Đảo gà trong sốt 1-2 phút, rắc mè rang."] },

  { id:90, e:"🫐", n:"Gà xào bông cải tỏi", cal:235, p:38, c:8, f:6, t:15, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#E4EEE4", type:"food",
    health:"Sulforaphane · Anti-cancer · Fiber",
    ing:[{n:"Ức gà",a:"150g"},{n:"Bông cải xanh",a:"150g"},{n:"Tỏi",a:"4 tép"},{n:"Dầu olive",a:"1 tsp"},{n:"Nước tương",a:"1 tbsp"},{n:"Tiêu đen",a:"½ tsp"}],
    steps:["Thái gà miếng nhỏ, cắt bông cải.","Xào tỏi vàng trong dầu olive.","Thêm gà, xào 4 phút.","Thêm bông cải + nước tương, xào 3 phút."] },

  { id:91, e:"🫛", n:"Gà xào măng tây", cal:220, p:38, c:6, f:5, t:15, g:"Giảm mỡ", tags:["Giảm mỡ","<15 phút"], bg:"#E4F0E4", type:"food",
    health:"Folate · Prebiotic · Spring vegetable",
    ing:[{n:"Ức gà",a:"150g"},{n:"Măng tây",a:"150g"},{n:"Tỏi",a:"3 tép"},{n:"Chanh",a:"½ quả"},{n:"Dầu olive",a:"1 tsp"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Thái gà mỏng, cắt đôi măng tây.","Xào tỏi trong dầu olive 30 giây.","Thêm gà, xào 4 phút đến chín.","Thêm măng tây, xào 2 phút. Vắt chanh."] },

  { id:92, e:"🌽", n:"Gà xào ngô đậu hà lan", cal:280, p:38, c:18, f:6, t:15, g:"Tăng cơ", tags:["Tăng cơ","<15 phút"], bg:"#FAF0E0", type:"food",
    health:"Fiber cao · Colorful · Quick protein",
    ing:[{n:"Ức gà",a:"150g"},{n:"Ngô hạt",a:"80g"},{n:"Đậu hà lan",a:"60g"},{n:"Cà rốt",a:"50g"},{n:"Nước tương",a:"1 tbsp"},{n:"Dầu mè",a:"1 tsp"}],
    steps:["Thái gà miếng nhỏ, ướp nước tương 5 phút.","Xào gà đến chín, để sang một bên.","Xào ngô + đậu + cà rốt 3 phút.","Gộp lại, rưới dầu mè."] },

  { id:93, e:"🥕", n:"Gà hầm rau củ kiểu Tây", cal:295, p:38, c:18, f:7, t:40, g:"Duy trì", tags:["Duy trì","Meal prep"], bg:"#F5EDDA", type:"food",
    health:"Comfort food · Fiber · Meal prep",
    ing:[{n:"Ức gà",a:"180g"},{n:"Cà rốt + củ cải",a:"100g mỗi"},{n:"Khoai tây nhỏ",a:"100g"},{n:"Hành tây",a:"1 củ"},{n:"Nước dùng gà",a:"400ml"},{n:"Thyme + bay leaf",a:"vừa đủ"}],
    steps:["Cắt tất cả rau củ miếng vừa.","Phi thơm hành tây.","Cho gà + rau + nước dùng + thảo mộc.","Hầm lửa nhỏ 30-35 phút."] },

  { id:94, e:"🍕", n:"Gà pizza healthy low-carb", cal:310, p:42, c:8, f:10, t:25, g:"Tăng cơ", tags:["Tăng cơ"], bg:"#FAF0E0", type:"food",
    health:"High protein crust · Creative · Satisfying",
    ing:[{n:"Ức gà xay",a:"200g"},{n:"Trứng",a:"1 quả"},{n:"Parmesan",a:"15g"},{n:"Sốt cà chua không đường",a:"3 tbsp"},{n:"Mozzarella ít béo",a:"30g"},{n:"Oregano",a:"1 tsp"}],
    steps:["Trộn gà xay + trứng + parmesan + oregano thành đế pizza.","Tạo hình tròn, nướng 200°C 15 phút.","Phết sốt cà chua + phô mai lên mặt.","Nướng thêm 8-10 phút đến vàng."] },

  { id:95, e:"🫘", n:"Gà xào đậu lăng", cal:320, p:42, c:20, f:6, t:20, g:"Tăng cơ", tags:["Tăng cơ","Meal prep"], bg:"#F0E8DC", type:"food",
    health:"Double protein · Iron cao · Plant + animal",
    ing:[{n:"Ức gà",a:"150g"},{n:"Đậu lăng đỏ nấu sẵn",a:"80g"},{n:"Hành tây",a:"½ củ"},{n:"Cà chua",a:"1 quả"},{n:"Cumin + coriander",a:"1 tsp mỗi"},{n:"Muối, tỏi",a:"vừa đủ"}],
    steps:["Thái gà miếng nhỏ, ướp cumin + coriander + muối.","Xào hành tây + tỏi đến thơm.","Thêm gà, xào 5 phút.","Thêm cà chua + đậu lăng, nấu 10 phút."] },

  { id:96, e:"🧀", n:"Gà nhồi phô mai feta rau bina", cal:275, p:41, c:3, f:9, t:25, g:"Tăng cơ", tags:["Tăng cơ","Nướng"], bg:"#F0F0E8", type:"food",
    health:"Calcium feta · Iron rau bina · Elegant",
    ing:[{n:"Ức gà dày",a:"200g"},{n:"Phô mai feta ít béo",a:"30g"},{n:"Rau bina",a:"40g"},{n:"Tỏi",a:"2 tép"},{n:"Muối, tiêu",a:"vừa đủ"},{n:"Dầu olive",a:"1 tsp"}],
    steps:["Rạch túi vào giữa ức gà không đứt.","Trộn feta + rau bina + tỏi băm, nhồi vào túi.","Ghim miệng túi, ướp muối tiêu + dầu olive.","Nướng 200°C 22-25 phút."] },

  { id:97, e:"🍋", n:"Gà baked chanh thảo mộc", cal:240, p:41, c:3, f:6, t:25, g:"Giảm mỡ", tags:["Giảm mỡ","Nướng"], bg:"#F0F0E0", type:"food",
    health:"Vitamin C · Herbs antioxidant · Light",
    ing:[{n:"Ức gà",a:"200g"},{n:"Chanh",a:"1 quả"},{n:"Tỏi",a:"4 tép"},{n:"Hương thảo + thyme",a:"2 cành mỗi"},{n:"Dầu olive",a:"1 tsp"},{n:"Muối, tiêu",a:"vừa đủ"}],
    steps:["Thái lát chanh, đập tỏi, vò nát thảo mộc.","Xếp gà lên khay nướng, phủ chanh + tỏi + thảo mộc.","Rưới dầu olive, nêm muối tiêu.","Nướng 190°C 22-25 phút."] },

  { id:98, e:"🫙", n:"Gà meal prep 5 ngày", cal:340, p:45, c:20, f:7, t:30, g:"Tăng cơ", tags:["Tăng cơ","Meal prep"], bg:"#F0EDE4", type:"food",
    health:"Batch cook · Tiết kiệm · Consistent nutrition",
    ing:[{n:"Ức gà",a:"1kg (5 khẩu phần)"},{n:"Gạo lứt",a:"400g (5 khẩu phần)"},{n:"Bông cải xanh",a:"500g"},{n:"Dầu olive",a:"2 tbsp"},{n:"Muối hồng, tiêu",a:"vừa đủ"},{n:"Tỏi bột, paprika",a:"1 tsp mỗi"}],
    steps:["Chia gà thành 5 phần 200g, ướp dầu olive + muối + tiêu + tỏi + paprika.","Nướng tất cả 200°C 20-22 phút.","Nấu gạo lứt + hấp bông cải song song.","Chia vào 5 hộp, bảo quản tủ lạnh đến 5 ngày."] },
];

export const FILTERS = ["Tất cả", "Giảm mỡ", "Tăng cơ", "Duy trì", "Sinh tố", "Meal prep", "<15 phút"] as const;
export type Filter = typeof FILTERS[number];

export const TAG_STYLE: Record<string, { bg: string; color: string }> = {
  "Tăng cơ":  { bg: "#FBF5DC", color: "#9A7A10" },
  "Giảm mỡ": { bg: "#FAEAE4", color: "#B85C38" },
  "Duy trì":  { bg: "#E4F0E8", color: "#4A7C59" },
  "Sinh tố":  { bg: "#F0E8DF", color: "#7A5230" },
  "Meal prep":{ bg: "#EEE8D8", color: "#5C4A28" },
  "<15 phút": { bg: "#E8EEF5", color: "#2C5A8C" },
  "Nướng":    { bg: "#F5EAE0", color: "#8B4513" },
};

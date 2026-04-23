const fs = require(" fs\);const recipes = [];
const goals = [" burn\, \build\, \maintain\];
const types = [" food\, \smoothie\];
const emojis = [" 🥗\, \🐟\, \🍗\, \🍤\, \🥑\, \🍲\, \🥬\, \🥩\, \🥛\, \🍚\];
const names = [" Salad uc ga nuong\, \Ca hoi ap chao\, \Sinh to bo chuoi\, \Uc ga luoc rau cu\, \Bun gao lut tom\, \Canh bi do tom\, \Salad ca ngu\, \Sinh to xanh\, \Ca thu nuong\, \Rau xao toi\];
for (let i = 0; i < 99; i++) {
  const goal = goals[Math.floor(i / 33)];
  const type = i % 3 === 0 ? " smoothie\ : \food\;
  const name = names[i % names.length];
  recipes.push({
    name_vi: name,
    emoji: emojis[i % emojis.length],
    type: type,
    goal: goal,
    goal_label: goal === " burn\ ? \Giam mo\ : goal === \build\ ? \Tang co\ : \Duy tri\,
    calories: 150 + Math.floor(Math.random() * 400),
    protein_g: parseFloat((5 + Math.random() * 40).toFixed(1)),
    carbs_g: parseFloat((5 + Math.random() * 50).toFixed(1)),
    fat_g: parseFloat((3 + Math.random() * 20).toFixed(1)),
    prep_time: 5 + Math.floor(Math.random() * 45),

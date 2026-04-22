import { Recipe } from './RecipeCard';

export interface RecipeDetailProps {
  recipe: Recipe;
  onBack?: () => void;
}

export function RecipeDetail({ recipe, onBack }: RecipeDetailProps) {
  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center gap-3'>
        {onBack && (
          <button
            onClick={onBack}
            className='p-2 rounded-lg hover:bg-gray-100'
          >
            ←
          </button>
        )}
        <div
          className='w-16 h-16 rounded-xl flex items-center justify-center text-4xl'
          style={{ backgroundColor: recipe.bg_color }}
        >
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.name_vi}
              className='w-full h-full object-cover rounded-xl'
            />
          ) : (
            <span>{recipe.emoji}</span>
          )}
        </div>
        <div>
          <h1 className='text-xl font-bold text-gray-900'>{recipe.name_vi}</h1>
          <p className='text-sm text-gray-500'>{recipe.health_note}</p>
        </div>
      </div>

      {/* Macros */}
      <div className='grid grid-cols-4 gap-2'>
        <div className='bg-orange-50 rounded-lg p-3 text-center'>
          <div className='text-2xl font-bold text-orange-600'>{recipe.calories}</div>
          <div className='text-xs text-gray-600'>kcal</div>
        </div>
        <div className='bg-blue-50 rounded-lg p-3 text-center'>
          <div className='text-2xl font-bold text-blue-600'>{recipe.protein_g}g</div>
          <div className='text-xs text-gray-600'>protein</div>
        </div>
        <div className='bg-yellow-50 rounded-lg p-3 text-center'>
          <div className='text-2xl font-bold text-yellow-600'>{recipe.carbs_g}g</div>
          <div className='text-xs text-gray-600'>carbs</div>
        </div>
        <div className='bg-green-50 rounded-lg p-3 text-center'>
          <div className='text-2xl font-bold text-green-600'>{recipe.fat_g}g</div>
          <div className='text-xs text-gray-600'>fat</div>
        </div>
      </div>

      {/* Info */}
      <div className='flex items-center gap-4 text-sm text-gray-600'>
        <span>⏱ {recipe.prep_time} phút</span>
        <span>🎯 {recipe.goal_label}</span>
        <span>🍽️ {recipe.type === 'food' ? 'Mon an' : 'Sinh to'}</span>
      </div>
    </div>
  );
}
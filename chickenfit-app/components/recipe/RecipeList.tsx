import { RecipeCard, Recipe } from './RecipeCard';

export interface RecipeListProps {
  recipes: Recipe[];
  onRecipeClick?: (recipe: Recipe) => void;
}

export function RecipeList({ recipes, onRecipeClick }: RecipeListProps) {
  if (recipes.length === 0) {
    return (
      <div className='text-center py-12 text-gray-500'>
        <p className='text-lg'>Khong tim thay cong thuc nao</p>
        <p className='text-sm mt-1'>Thu thay doi bo loc de tim kiem</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-3'>
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onClick={() => onRecipeClick?.(recipe)}
        />
      ))}
    </div>
  );
}
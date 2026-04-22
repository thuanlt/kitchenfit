import { Card } from "../ui/Card";
import { Tag } from "../ui/Tag";

export interface Recipe {
  id: number;
  name_vi: string;
  emoji: string;
  type: string;
  goal: string;
  goal_label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  prep_time: number;
  bg_color: string;
  health_note: string;
  image_url?: string;
}

export interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <Card onClick={onClick} className="overflow-hidden">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div
          className="w-20 h-20 rounded-lg flex-shrink-0 flex items-center justify-center text-3xl"
          style={{ backgroundColor: recipe.bg_color }}
        >
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.name_vi}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span>{recipe.emoji}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {recipe.name_vi}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Tag variant="primary" size="sm">
              {recipe.goal_label}
            </Tag>
            <span className="text-xs text-gray-500">
              {recipe.prep_time} phút
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
            <span>🔥 {recipe.calories} kcal</span>
            <span>💪 {recipe.protein_g}g</span>
            <span>🍞 {recipe.carbs_g}g</span>
            <span>🥑 {recipe.fat_g}g</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
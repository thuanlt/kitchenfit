# ChickenFit Components

## UI Components

### Button
Reusable button component with multiple variants and sizes.

`	sx
import { Button } from '@/components';

<Button onClick={() => console.log('clicked')}>Click me</Button>
<Button variant='secondary'>Secondary</Button>
<Button variant='outline'>Outline</Button>
`

### Card
Container component with consistent styling.

`	sx
import { Card } from '@/components';

<Card>
  <p>Card content</p>
</Card>
`

### Tag
Small pill-shaped tags for categorization.

`	sx
import { Tag } from '@/components';

<Tag variant='primary'>Primary</Tag>
<Tag variant='success'>Success</Tag>
`

### Input
Form input with label and error handling.

`	sx
import { Input } from '@/components';

<Input label='Email' type='email' placeholder='Enter email' />
<Input label='Password' type='password' error='Required' />
`

### Badge
Small colored badges for status indicators.

`	sx
import { Badge } from '@/components';

<Badge color='orange'>New</Badge>
<Badge color='green'>Active</Badge>
`

## Recipe Components

### RecipeCard
Display a single recipe with thumbnail, macros, and quick info.

`	sx
import { RecipeCard } from '@/components';

<RecipeCard recipe={recipe} onClick={() => navigate(recipe.id)} />
`

### RecipeList
Grid of recipe cards with empty state handling.

`	sx
import { RecipeList } from '@/components';

<RecipeList recipes={recipes} onRecipeClick={(r) => navigate(r.id)} />
`

### RecipeDetail
Full recipe detail view with macros breakdown.

`	sx
import { RecipeDetail } from '@/components';

<RecipeDetail recipe={recipe} onBack={() => navigate(-1)} />
`

## Design System

### Colors
- Primary: Orange-500 (#F97316)
- Secondary: Gray-200 (#E5E7EB)
- Success: Green-500 (#22C55E)
- Error: Red-500 (#EF4444)

### Spacing
- Small: 0.5rem (8px)
- Medium: 1rem (16px)
- Large: 1.5rem (24px)

### Typography
- Heading: Bold, text-lg to text-xl
- Body: Regular, text-sm to text-base
- Caption: Regular, text-xs

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardMedia, CardContent, Button, Chip, Grid, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '../supabaseClient';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select(`*, ingredients(*), steps(*), recipe_images(*), recipe_categories(categories(*)), user:user_id(username, avatar_url)`)
        .eq('id', id)
        .single();
      if (!error) setRecipe(data);
      setLoading(false);
    };
    fetchRecipe();
  }, [id]);

  if (loading) return <Box sx={{ textAlign: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (!recipe) return <Typography>Rezept nicht gefunden.</Typography>;

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Zurück
      </Button>
      <Card>
        {recipe.recipe_images?.[0]?.image_url && (
          <CardMedia
            component="img"
            height="300"
            image={recipe.recipe_images[0].image_url}
            alt={recipe.title}
          />
        )}
        <CardContent>
          <Typography variant="h4" gutterBottom>{recipe.title}</Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {recipe.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Typography>Zubereitung: {recipe.preparation_time} Min.</Typography>
            <Typography>Kochzeit: {recipe.cooking_time} Min.</Typography>
            <Typography>Portionen: {recipe.servings}</Typography>
            <Typography>Schwierigkeit: {recipe.difficulty}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            {recipe.recipe_categories?.map(rc => (
              <Chip key={rc.category.id} label={rc.category.name} sx={{ mr: 1 }} />
            ))}
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Zutaten</Typography>
            <ul>
              {recipe.ingredients?.map(ing => (
                <li key={ing.id}>{ing.amount} {ing.unit} {ing.name}</li>
              ))}
            </ul>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Zubereitung</Typography>
            <ol>
              {recipe.steps?.sort((a, b) => a.order_index - b.order_index).map(step => (
                <li key={step.id} style={{ marginBottom: 12 }}>
                  {step.description}
                  {step.image_url && (
                    <Box sx={{ mt: 1 }}>
                      <img src={step.image_url} alt="Schritt" style={{ maxWidth: 300, borderRadius: 8 }} />
                    </Box>
                  )}
                </li>
              ))}
            </ol>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">Erstellt von: {recipe.user?.username}</Typography>
            {recipe.user?.avatar_url && (
              <img src={recipe.user.avatar_url} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 
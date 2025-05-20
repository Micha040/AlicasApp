import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useMediaQuery
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../supabaseClient';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(null);
  const [categories, setCategories] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isMobile = useMediaQuery('(max-width:600px)');

  // User aus localStorage holen
  const user = React.useMemo(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  useEffect(() => {
    fetchRecipe();
    fetchCategories();
  }, [id]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (data) setCategories(data);
  };

  const fetchRecipe = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients(*),
        steps(*),
        recipe_images(*),
        recipe_categories(categories(*)),
        user:user_id (username, avatar_url)
      `)
      .eq('id', id)
      .single();
    
    if (!error) {
      setRecipe(data);
      setEditedRecipe({
        ...data,
        ingredients: [...data.ingredients],
        steps: [...data.steps].sort((a, b) => a.order_index - b.order_index),
        categories: data.recipe_categories?.map(rc => rc.categories?.id) || []
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      // Update Hauptrezept
      const { error: recipeError } = await supabase
        .from('recipes')
        .update({
          title: editedRecipe.title,
          description: editedRecipe.description,
          preparation_time: parseInt(editedRecipe.preparation_time),
          cooking_time: parseInt(editedRecipe.cooking_time),
          servings: parseInt(editedRecipe.servings),
          difficulty: editedRecipe.difficulty
        })
        .eq('id', recipe.id);

      if (recipeError) throw recipeError;

      // Update Zutaten
      await supabase
        .from('ingredients')
        .delete()
        .eq('recipe_id', recipe.id);

      const { error: ingredientsError } = await supabase
        .from('ingredients')
        .insert(
          editedRecipe.ingredients.map((ing, index) => ({
            recipe_id: recipe.id,
            name: ing.name,
            amount: parseFloat(ing.amount),
            unit: ing.unit,
            order_index: index
          }))
        );

      if (ingredientsError) throw ingredientsError;

      // Update Schritte
      await supabase
        .from('steps')
        .delete()
        .eq('recipe_id', recipe.id);

      const { error: stepsError } = await supabase
        .from('steps')
        .insert(
          editedRecipe.steps.map((step, index) => ({
            recipe_id: recipe.id,
            description: step.description,
            image_url: step.image_url,
            order_index: index
          }))
        );

      if (stepsError) throw stepsError;

      // Update Kategorien
      await supabase
        .from('recipe_categories')
        .delete()
        .eq('recipe_id', recipe.id);

      if (editedRecipe.categories.length > 0) {
        const { error: categoriesError } = await supabase
          .from('recipe_categories')
          .insert(
            editedRecipe.categories.map(categoryId => ({
              recipe_id: recipe.id,
              category_id: categoryId
            }))
          );

        if (categoriesError) throw categoriesError;
      }

      setSuccess('Rezept erfolgreich aktualisiert!');
      setEditMode(false);
      fetchRecipe();
    } catch (error) {
      console.error('Error updating recipe:', error);
      setError('Fehler beim Aktualisieren des Rezepts');
    }
  };

  const handleDelete = async () => {
    try {
      // Lösche alle verknüpften Daten
      await Promise.all([
        supabase.from('ingredients').delete().eq('recipe_id', recipe.id),
        supabase.from('steps').delete().eq('recipe_id', recipe.id),
        supabase.from('recipe_categories').delete().eq('recipe_id', recipe.id),
        supabase.from('recipe_images').delete().eq('recipe_id', recipe.id),
        supabase.from('recipe_likes').delete().eq('recipe_id', recipe.id),
        supabase.from('recipe_comments').delete().eq('recipe_id', recipe.id)
      ]);

      // Lösche das Rezept selbst
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipe.id);

      if (error) throw error;

      navigate('/');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setError('Fehler beim Löschen des Rezepts');
    }
  };

  const handleAddIngredient = () => {
    setEditedRecipe({
      ...editedRecipe,
      ingredients: [...editedRecipe.ingredients, { name: '', amount: '', unit: '' }]
    });
  };

  const handleAddStep = () => {
    setEditedRecipe({
      ...editedRecipe,
      steps: [...editedRecipe.steps, { description: '', image_url: '' }]
    });
  };

  if (loading) return <Box sx={{ textAlign: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (!recipe) return <Typography>Rezept nicht gefunden.</Typography>;

  const isOwner = recipe.user_id === user?.id;

  console.log('recipe.user_id:', recipe.user_id);
  console.log('user:', user);
  console.log('Vergleich:', recipe.user_id === user?.id);

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Zurück
      </Button>
      <Card sx={{ borderRadius: 4, boxShadow: 4, p: { xs: 1, sm: 2 }, bgcolor: 'background.paper' }}>
        {recipe.recipe_images?.[0]?.image_url && (
          <CardMedia
            component="img"
            height={isMobile ? 180 : 300}
            image={recipe.recipe_images[0].image_url}
            alt={recipe.title}
            sx={{ objectFit: 'cover', borderRadius: 3, mb: 2 }}
          />
        )}
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} gutterBottom sx={{ flex: 1, wordBreak: 'break-word' }}>{recipe.title}</Typography>
            {isOwner && !editMode && (
              isMobile ? (
                <Box sx={{ width: '100%', display: 'flex', gap: 2, mt: 1 }}>
                  <Button fullWidth variant="contained" color="primary" startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
                    Bearbeiten
                  </Button>
                  <Button fullWidth variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteDialogOpen(true)}>
                    Löschen
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={() => setEditMode(true)} color="primary" size="large">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => setDeleteDialogOpen(true)} color="error" size="large">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )
            )}
          </Box>

          <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ mb: 2, fontSize: isMobile ? '1rem' : '1.1rem' }}>
            {recipe.description}
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}><Typography variant="body2">Zubereitung: <b>{recipe.preparation_time} Min.</b></Typography></Grid>
            <Grid item xs={6} sm={3}><Typography variant="body2">Kochzeit: <b>{recipe.cooking_time} Min.</b></Typography></Grid>
            <Grid item xs={6} sm={3}><Typography variant="body2">Portionen: <b>{recipe.servings}</b></Typography></Grid>
            <Grid item xs={6} sm={3}><Typography variant="body2">Schwierigkeit: <b>{recipe.difficulty}</b></Typography></Grid>
          </Grid>

          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {recipe.recipe_categories?.map(rc => (
              rc.categories && <Chip key={rc.categories.id} label={rc.categories.name} color="primary" variant="outlined" />
            ))}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Zutaten</Typography>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {recipe.ingredients?.map(ing => (
                <li key={ing.id} style={{ marginBottom: 4, fontSize: isMobile ? 15 : 16 }}>{ing.amount} {ing.unit} {ing.name}</li>
              ))}
            </ul>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Zubereitung</Typography>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {recipe.steps?.sort((a, b) => a.order_index - b.order_index).map(step => (
                <li key={step.id} style={{ marginBottom: 16, fontSize: isMobile ? 15 : 16 }}>
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Typography variant="body2">Erstellt von: {recipe.user?.username}</Typography>
            {recipe.user?.avatar_url && (
              <img src={recipe.user.avatar_url} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            )}
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Rezept löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchtest du dieses Rezept wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Fab,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Timer as TimerIcon,
  Restaurant as RestaurantIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function RecipesTab({ user }) {
  const [recipes, setRecipes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    preparation_time: '',
    cooking_time: '',
    servings: '',
    difficulty: 'Mittel',
    ingredients: [{ name: '', amount: '', unit: '' }],
    steps: [{ description: '', image_url: '' }],
    categories: []
  });
  const [categories, setCategories] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecipes();
    fetchCategories();
  }, []);

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients (*),
        steps (*),
        recipe_categories (categories (*)),
        recipe_images (*),
        recipe_likes (user_id),
        user:user_id (username, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      return;
    }
    setRecipes(data);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    setCategories(data);
  };

  const handleCreateRecipe = async () => {
    try {
      // 1. Rezept erstellen
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert([{
          user_id: user.id,
          title: newRecipe.title,
          description: newRecipe.description,
          preparation_time: parseInt(newRecipe.preparation_time),
          cooking_time: parseInt(newRecipe.cooking_time),
          servings: parseInt(newRecipe.servings),
          difficulty: newRecipe.difficulty
        }])
        .select()
        .single();

      if (recipeError) throw recipeError;

      // 2. Zutaten einfügen
      const ingredients = newRecipe.ingredients.map((ing, index) => ({
        recipe_id: recipe.id,
        name: ing.name,
        amount: parseFloat(ing.amount),
        unit: ing.unit,
        order_index: index
      }));

      const { error: ingredientsError } = await supabase
        .from('ingredients')
        .insert(ingredients);

      if (ingredientsError) throw ingredientsError;

      // 3. Schritte einfügen
      const steps = newRecipe.steps.map((step, index) => ({
        recipe_id: recipe.id,
        description: step.description,
        image_url: step.image_url,
        order_index: index
      }));

      const { error: stepsError } = await supabase
        .from('steps')
        .insert(steps);

      if (stepsError) throw stepsError;

      // 4. Kategorien verknüpfen
      if (newRecipe.categories.length > 0) {
        const categoryLinks = newRecipe.categories.map(categoryId => ({
          recipe_id: recipe.id,
          category_id: categoryId
        }));

        const { error: categoriesError } = await supabase
          .from('recipe_categories')
          .insert(categoryLinks);

        if (categoriesError) throw categoriesError;
      }

      setSnackbar({
        open: true,
        message: 'Rezept erfolgreich erstellt!',
        severity: 'success'
      });
      setOpenDialog(false);
      fetchRecipes();
    } catch (error) {
      console.error('Error creating recipe:', error);
      setSnackbar({
        open: true,
        message: 'Fehler beim Erstellen des Rezepts',
        severity: 'error'
      });
    }
  };

  const handleLike = async (recipeId) => {
    try {
      const { error } = await supabase
        .from('recipe_likes')
        .insert([{ recipe_id: recipeId, user_id: user.id }]);

      if (error) throw error;
      fetchRecipes();
    } catch (error) {
      console.error('Error liking recipe:', error);
    }
  };

  const handleUnlike = async (recipeId) => {
    try {
      const { error } = await supabase
        .from('recipe_likes')
        .delete()
        .match({ recipe_id: recipeId, user_id: user.id });

      if (error) throw error;
      fetchRecipes();
    } catch (error) {
      console.error('Error unliking recipe:', error);
    }
  };

  const handleAddIngredient = () => {
    setNewRecipe({
      ...newRecipe,
      ingredients: [...newRecipe.ingredients, { name: '', amount: '', unit: '' }]
    });
  };

  const handleAddStep = () => {
    setNewRecipe({
      ...newRecipe,
      steps: [...newRecipe.steps, { description: '', image_url: '' }]
    });
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...newRecipe.ingredients];
    newIngredients[index][field] = value;
    setNewRecipe({ ...newRecipe, ingredients: newIngredients });
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...newRecipe.steps];
    newSteps[index][field] = value;
    setNewRecipe({ ...newRecipe, steps: newSteps });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Rezepte
        </Typography>
        <Fab
          color="primary"
          onClick={() => setOpenDialog(true)}
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
        >
          <AddIcon />
        </Fab>
      </Box>

      <Grid container spacing={3}>
        {recipes.map((recipe) => (
          <Grid item xs={12} sm={6} md={4} key={recipe.id}>
            <Card
              onClick={() => navigate(`/rezepte/${recipe.id}`)}
              sx={{ cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }}
            >
              <CardMedia
                component="img"
                height="200"
                image={recipe.recipe_images?.[0]?.image_url || 'https://via.placeholder.com/300x200'}
                alt={recipe.title}
              />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {recipe.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {recipe.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimerIcon sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    {recipe.preparation_time + recipe.cooking_time} Min.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RestaurantIcon sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    {recipe.servings} Portionen
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <IconButton
                    onClick={() => handleLike(recipe.id)}
                    color="primary"
                  >
                    {recipe.recipe_likes?.some(like => like.user_id === user.id) ? (
                      <FavoriteIcon />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </IconButton>
                  <IconButton>
                    <CommentIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Neues Rezept erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Titel"
              value={newRecipe.title}
              onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Beschreibung"
              multiline
              rows={3}
              value={newRecipe.description}
              onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Zubereitungszeit (Minuten)"
                  type="number"
                  value={newRecipe.preparation_time}
                  onChange={(e) => setNewRecipe({ ...newRecipe, preparation_time: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Kochzeit (Minuten)"
                  type="number"
                  value={newRecipe.cooking_time}
                  onChange={(e) => setNewRecipe({ ...newRecipe, cooking_time: e.target.value })}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Portionen"
                  type="number"
                  value={newRecipe.servings}
                  onChange={(e) => setNewRecipe({ ...newRecipe, servings: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Schwierigkeitsgrad</InputLabel>
                  <Select
                    value={newRecipe.difficulty}
                    onChange={(e) => setNewRecipe({ ...newRecipe, difficulty: e.target.value })}
                  >
                    <MenuItem value="Einfach">Einfach</MenuItem>
                    <MenuItem value="Mittel">Mittel</MenuItem>
                    <MenuItem value="Schwer">Schwer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Zutaten
            </Typography>
            {newRecipe.ingredients.map((ingredient, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Menge"
                    value={ingredient.amount}
                    onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Einheit"
                    value={ingredient.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label="Zutat"
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  />
                </Grid>
              </Grid>
            ))}
            <Button
              variant="outlined"
              onClick={handleAddIngredient}
              startIcon={<AddIcon />}
              sx={{ mb: 3 }}
            >
              Zutat hinzufügen
            </Button>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Zubereitungsschritte
            </Typography>
            {newRecipe.steps.map((step, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Schritt ${index + 1}`}
                  multiline
                  rows={2}
                  value={step.description}
                  onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  label="Bild-URL (optional)"
                  value={step.image_url}
                  onChange={(e) => handleStepChange(index, 'image_url', e.target.value)}
                />
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={handleAddStep}
              startIcon={<AddIcon />}
              sx={{ mb: 3 }}
            >
              Schritt hinzufügen
            </Button>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Kategorien
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  onClick={() => {
                    const newCategories = newRecipe.categories.includes(category.id)
                      ? newRecipe.categories.filter(id => id !== category.id)
                      : [...newRecipe.categories, category.id];
                    setNewRecipe({ ...newRecipe, categories: newCategories });
                  }}
                  color={newRecipe.categories.includes(category.id) ? 'primary' : 'default'}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button onClick={handleCreateRecipe} variant="contained" color="primary">
            Rezept erstellen
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 
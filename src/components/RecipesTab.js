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
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Timer as TimerIcon,
  Restaurant as RestaurantIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import RecipeCommentsDialog from './RecipeCommentsDialog';
import { useTranslation } from 'react-i18next';

export default function RecipesTab({ user }) {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
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
    categories: [],
    mainImageUrl: '',
    mainImageFile: null
  });
  const [categories, setCategories] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  useEffect(() => {
    fetchRecipes();
    fetchCategories();
  }, []);

  useEffect(() => {
    const filterRecipes = () => {
      let filtered = [...recipes];
      
      // Textsuche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(recipe => 
          recipe.title.toLowerCase().includes(searchLower) ||
          recipe.description.toLowerCase().includes(searchLower) ||
          recipe.ingredients?.some(ing => ing.name.toLowerCase().includes(searchLower))
        );
      }

      // Kategorie-Filter
      if (selectedCategory) {
        filtered = filtered.filter(recipe =>
          recipe.recipe_categories?.some(rc => rc.categories?.id === selectedCategory)
        );
      }

      setFilteredRecipes(filtered);
    };

    filterRecipes();
  }, [recipes, searchTerm, selectedCategory]);

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

      // 5. Titelbild speichern
      let mainImageUrl = newRecipe.mainImageUrl;
      if (newRecipe.mainImageFile) {
        // Bild als base64 speichern (alternativ: Upload zu Storage)
        mainImageUrl = newRecipe.mainImageFile;
      }
      if (mainImageUrl) {
        await supabase.from('recipe_images').insert({
          recipe_id: recipe.id,
          image_url: mainImageUrl,
          is_main_image: true
        });
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
    <Box sx={{ position: 'relative', minHeight: '100vh', pb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          {t('Rezepte')}
        </Typography>
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => setOpenDialog(true)}
          sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
        >
          <AddIcon />
        </Fab>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          placeholder={t('RezepteDurchsuchen')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('Kategorie')}</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label={t('Kategorie')}
          >
            <MenuItem value="">{t('Alle')}</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {filteredRecipes.map((recipe) => (
          <Grid item xs={12} sm={6} md={4} key={recipe.id}>
            <Card
              onClick={() => navigate(`/rezepte/${recipe.id}`)}
              sx={{ cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }}
            >
              <CardMedia
                component="img"
                height="200"
                image={recipe.recipe_images?.find(img => img.is_main_image)?.image_url || 'https://via.placeholder.com/300x200'}
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
                    {recipe.preparation_time + recipe.cooking_time} {t('Min')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RestaurantIcon sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    {recipe.servings} {t('PortionenText')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleLike(recipe.id); }}
                    color="primary"
                    title={t('RezeptLiken')}
                  >
                    {recipe.recipe_likes?.some(like => like.user_id === user.id) ? (
                      <FavoriteIcon />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </IconButton>
                  <IconButton
                    onClick={e => { e.stopPropagation(); setSelectedRecipeId(recipe.id); setCommentsDialogOpen(true); }}
                    title={t('KommentarOeffnen')}
                  >
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
        <DialogTitle>{t('NeuesRezeptErstellen')}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('Titel')}
              value={newRecipe.title}
              onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('Beschreibung')}
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
                  label={t('Zubereitungszeit')}
                  type="number"
                  value={newRecipe.preparation_time}
                  onChange={(e) => setNewRecipe({ ...newRecipe, preparation_time: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('Kochzeit')}
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
                  label={t('Portionen')}
                  type="number"
                  value={newRecipe.servings}
                  onChange={(e) => setNewRecipe({ ...newRecipe, servings: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('Schwierigkeitsgrad')}</InputLabel>
                  <Select
                    value={newRecipe.difficulty}
                    onChange={(e) => setNewRecipe({ ...newRecipe, difficulty: e.target.value })}
                    label={t('Schwierigkeitsgrad')}
                  >
                    <MenuItem value="Einfach">{t('Einfach')}</MenuItem>
                    <MenuItem value="Mittel">{t('Mittel')}</MenuItem>
                    <MenuItem value="Schwer">{t('Schwer')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              {t('Zutaten')}
            </Typography>
            {newRecipe.ingredients.map((ingredient, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('Menge')}
                    value={ingredient.amount}
                    onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label={t('Einheit')}
                    value={ingredient.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label={t('Zutat')}
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
              {t('ZutatHinzufuegen')}
            </Button>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              {t('Zubereitungsschritte')}
            </Typography>
            {newRecipe.steps.map((step, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label={`${t('Schritt')} ${index + 1}`}
                  multiline
                  rows={2}
                  value={step.description}
                  onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  label={t('BildURLOptional')}
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
              {t('SchrittHinzufuegen')}
            </Button>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>{t('Kategorien')}</Typography>
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

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>{t('Titelbild')}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TextField
                label={t('BildURL')}
                value={newRecipe.mainImageUrl}
                onChange={e => setNewRecipe({ ...newRecipe, mainImageUrl: e.target.value })}
                fullWidth
              />
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="main-image-upload"
                type="file"
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setNewRecipe(nr => ({ ...nr, mainImageFile: reader.result, mainImageUrl: '' }));
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label htmlFor="main-image-upload">
                <Button variant="outlined" component="span">{t('BildHochladen')}</Button>
              </label>
            </Box>
            {(newRecipe.mainImageFile || newRecipe.mainImageUrl) && (
              <Box sx={{ mb: 2 }}>
                <img
                  src={newRecipe.mainImageFile || newRecipe.mainImageUrl}
                  alt={t('TitelbildVorschau')}
                  style={{ maxWidth: 200, borderRadius: 8 }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('Abbrechen')}</Button>
          <Button onClick={handleCreateRecipe} variant="contained" color="primary">
            {t('RezeptErstellenBtn')}
          </Button>
        </DialogActions>
      </Dialog>

      <RecipeCommentsDialog
        open={commentsDialogOpen}
        onClose={() => setCommentsDialogOpen(false)}
        recipeId={selectedRecipeId}
        user={user}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message === 'Rezept erfolgreich erstellt!' ? t('RezeptErfolg') : snackbar.message === 'Fehler beim Erstellen des Rezepts' ? t('FehlerRezept') : snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 
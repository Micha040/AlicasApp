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
  Alert
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
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setCurrentUser(userData);
      }
    };
    getCurrentUser();
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
        user:user_id(username, avatar_url)
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

  const isOwner = recipe.user?.username === currentUser?.username;

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Zurück
        </Button>
        {isOwner && !editMode && (
          <Box>
            <IconButton onClick={() => setEditMode(true)} color="primary">
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => setDeleteDialogOpen(true)} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
        {editMode && (
          <Box>
            <Button onClick={() => setEditMode(false)} sx={{ mr: 1 }}>
              Abbrechen
            </Button>
            <Button variant="contained" onClick={handleSave}>
              Speichern
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

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
          {editMode ? (
            <>
              <TextField
                fullWidth
                label="Titel"
                value={editedRecipe.title}
                onChange={(e) => setEditedRecipe({ ...editedRecipe, title: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Beschreibung"
                multiline
                rows={3}
                value={editedRecipe.description}
                onChange={(e) => setEditedRecipe({ ...editedRecipe, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Zubereitungszeit (Min.)"
                    type="number"
                    value={editedRecipe.preparation_time}
                    onChange={(e) => setEditedRecipe({ ...editedRecipe, preparation_time: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Kochzeit (Min.)"
                    type="number"
                    value={editedRecipe.cooking_time}
                    onChange={(e) => setEditedRecipe({ ...editedRecipe, cooking_time: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Portionen"
                    type="number"
                    value={editedRecipe.servings}
                    onChange={(e) => setEditedRecipe({ ...editedRecipe, servings: e.target.value })}
                  />
                </Grid>
              </Grid>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Schwierigkeitsgrad</InputLabel>
                <Select
                  value={editedRecipe.difficulty}
                  onChange={(e) => setEditedRecipe({ ...editedRecipe, difficulty: e.target.value })}
                  label="Schwierigkeitsgrad"
                >
                  <MenuItem value="Einfach">Einfach</MenuItem>
                  <MenuItem value="Mittel">Mittel</MenuItem>
                  <MenuItem value="Schwer">Schwer</MenuItem>
                </Select>
              </FormControl>
            </>
          ) : (
            <>
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
            </>
          )}

          {editMode ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Kategorien</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    label={category.name}
                    onClick={() => {
                      const newCategories = editedRecipe.categories.includes(category.id)
                        ? editedRecipe.categories.filter(id => id !== category.id)
                        : [...editedRecipe.categories, category.id];
                      setEditedRecipe({ ...editedRecipe, categories: newCategories });
                    }}
                    color={editedRecipe.categories.includes(category.id) ? 'primary' : 'default'}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ mb: 2 }}>
              {recipe.recipe_categories?.map(rc => (
                rc.categories && <Chip key={rc.categories.id} label={rc.categories.name} sx={{ mr: 1 }} />
              ))}
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Zutaten</Typography>
            {editMode ? (
              <>
                {editedRecipe.ingredients.map((ing, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      label="Menge"
                      value={ing.amount}
                      onChange={(e) => {
                        const newIngredients = [...editedRecipe.ingredients];
                        newIngredients[index] = { ...ing, amount: e.target.value };
                        setEditedRecipe({ ...editedRecipe, ingredients: newIngredients });
                      }}
                    />
                    <TextField
                      label="Einheit"
                      value={ing.unit}
                      onChange={(e) => {
                        const newIngredients = [...editedRecipe.ingredients];
                        newIngredients[index] = { ...ing, unit: e.target.value };
                        setEditedRecipe({ ...editedRecipe, ingredients: newIngredients });
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Zutat"
                      value={ing.name}
                      onChange={(e) => {
                        const newIngredients = [...editedRecipe.ingredients];
                        newIngredients[index] = { ...ing, name: e.target.value };
                        setEditedRecipe({ ...editedRecipe, ingredients: newIngredients });
                      }}
                    />
                    <IconButton
                      onClick={() => {
                        const newIngredients = editedRecipe.ingredients.filter((_, i) => i !== index);
                        setEditedRecipe({ ...editedRecipe, ingredients: newIngredients });
                      }}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button onClick={handleAddIngredient} variant="outlined" sx={{ mt: 1 }}>
                  Zutat hinzufügen
                </Button>
              </>
            ) : (
              <ul>
                {recipe.ingredients?.map(ing => (
                  <li key={ing.id}>{ing.amount} {ing.unit} {ing.name}</li>
                ))}
              </ul>
            )}
          </Box>

          <Box>
            <Typography variant="h6">Zubereitung</Typography>
            {editMode ? (
              <>
                {editedRecipe.steps.map((step, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label={`Schritt ${index + 1}`}
                      multiline
                      rows={2}
                      value={step.description}
                      onChange={(e) => {
                        const newSteps = [...editedRecipe.steps];
                        newSteps[index] = { ...step, description: e.target.value };
                        setEditedRecipe({ ...editedRecipe, steps: newSteps });
                      }}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Bild-URL (optional)"
                      value={step.image_url || ''}
                      onChange={(e) => {
                        const newSteps = [...editedRecipe.steps];
                        newSteps[index] = { ...step, image_url: e.target.value };
                        setEditedRecipe({ ...editedRecipe, steps: newSteps });
                      }}
                    />
                    <IconButton
                      onClick={() => {
                        const newSteps = editedRecipe.steps.filter((_, i) => i !== index);
                        setEditedRecipe({ ...editedRecipe, steps: newSteps });
                      }}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button onClick={handleAddStep} variant="outlined">
                  Schritt hinzufügen
                </Button>
              </>
            ) : (
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
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">Erstellt von: {recipe.user?.username}</Typography>
            {recipe.user?.avatar_url && (
              <img src={recipe.user.avatar_url} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Rezept löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie dieses Rezept wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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
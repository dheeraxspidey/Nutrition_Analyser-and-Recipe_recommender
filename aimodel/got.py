import streamlit as st
import pandas as pd
import numpy as np
import pickle
from PIL import Image
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense


st.set_page_config(layout='centered', page_title='AI-Powered Recipe Recommender')


# Let's specify which column, fix its width, and let's give this image a caption:



# Load the saved models and components
with open('C:/Users/22071/Desktop/nutrition/aimodel/recipe_recommendation_model.pkl', 'rb') as file:
    model = pickle.load(file)

with open('C:/Users/22071/Desktop/nutrition/aimodel/pca_model.pkl', 'rb') as file:
    pca = pickle.load(file)

with open('C:/Users/22071/Desktop/nutrition/aimodel/tfidf_vectorizer.pkl', 'rb') as file:
    tfidf = pickle.load(file)

@st.cache_data
def load_data(filepath):
    return pd.read_csv(filepath)

# Use the cached function to load the data
df = load_data('C:/Users/22071/Desktop/nutrition/aimodel/all_recipes_final_df_v2.csv')

# Update the columns to reflect grams with daily percentage
df['Carbohydrates g(Daily %)'] = df.apply(lambda x: f"{x['carbohydrates_g']}g ({x['carbohydrates_g_dv_perc']}%)", axis=1)
df['Sugars g(Daily %)'] = df.apply(lambda x: f"{x['sugars_g']}g ({x['sugars_g_dv_perc']}%)", axis=1)
df['Fat g(Daily %)'] = df.apply(lambda x: f"{x['fat_g']}g ({x['fat_g_dv_perc']}%)", axis=1)
df['Protein g(Daily %)'] = df.apply(lambda x: f"{x['protein_g']}g ({x['protein_g_dv_perc']}%)", axis=1)


# Transform the combined features using the loaded TF-IDF vectorizer and PCA model
tfidf_matrix = tfidf.transform(df['combined_features'])  # Use transform instead of fit_transform
tfidf_pca = pca.transform(tfidf_matrix.toarray())  # Use transform instead of fit_transform



# Rename the columns to user-friendly names
friendly_names = {
    'name': 'Recipe Name',
    'category': 'Category',
    'calories': 'Calories (kcal)',
    'servings': 'Servings',
    'Carbohydrates g(Daily %)': 'Carbohydrates g(Daily %)',
    'Sugars g(Daily %)': 'Sugars g(Daily %)',
    'Fat g(Daily %)': 'Fat g(Daily %)',
    'Protein g(Daily %)': 'Protein g(Daily %)',
    'cook': 'Cook Time (minutes)',
    'rating': 'Rating',
    'rating_count': 'Rating Count',
    'diet_type' : 'Diet Type',
    'ingredients': 'Ingredients',
    'directions': 'Directions'
            }
# Function to get similar recipes
def get_similar_recipes(recipe_name, top_n=5, diversify=False, diversity_factor=0.1):
    target_index = df[df['name'] == recipe_name].index[0]
    target_features = tfidf.transform([df['combined_features'].iloc[target_index]])
    target_features_pca = pca.transform(target_features.toarray())
    target_cluster = model.predict(target_features_pca).argmax()
    cluster_indices = df[df['cluster'] == target_cluster].index
    similarities = cosine_similarity(target_features_pca, tfidf_pca[cluster_indices]).flatten()
    weighted_similarities = similarities * df.loc[cluster_indices, 'rating']
    
    if diversify:
        diversified_scores = weighted_similarities * (1 - diversity_factor * np.arange(len(weighted_similarities)))
        similar_indices = cluster_indices[np.argsort(diversified_scores)[-top_n:][::-1]]
    else:
        similar_indices = cluster_indices[np.argsort(weighted_similarities)[-top_n:][::-1]]
    
    # Retrieve similar recipes and sort them by rating_count and rating
    similar_recipes = df.iloc[similar_indices]
    similar_recipes_sorted = similar_recipes.sort_values(by=['rating_count', 'rating'], ascending=False)
    
    # Select only the desired columns
    selected_columns = ['name', 'category', 'ingredients', 'directions','rating', 'rating_count', 'diet_type','calories', 'servings', 'Carbohydrates g(Daily %)', 'Sugars g(Daily %)', 'Fat g(Daily %)', 'Protein g(Daily %)', 'cook']
    selected_recipes = similar_recipes_sorted[selected_columns].head(top_n)
    
    
    return selected_recipes.rename(columns=friendly_names)

# Function to filter recipes by servings
def filter_by_servings(servings):
    if servings == "one":
        return df[df['servings'] == 1]
    elif servings == "two":
        return df[df['servings'] == 2]
    elif servings == "crowd":
        return df[df['servings'] >= 5]
    else:
        return pd.DataFrame()

# Function to filter recipes by name
def filter_by_recipe_name(name):
    return df[df['name'].str.contains(name, case=False, na=False)]


# Function to filter and sort recipes
def filter_and_sort_by_recipe_name(name):
    results = filter_by_recipe_name(name)
    return results.sort_values(by=['rating_count','rating'], ascending=False)

def autocomplete_suggestions(user_input, df, max_suggestions=5):
    # Filter recipe names that contain the user input
    filtered_df = df[df['name'].str.contains(user_input, case=False, na=False)]
    
    # Sort by rating_count to prioritize popular recipes
    sorted_df = filtered_df.sort_values(by='rating_count', ascending=False)
    
    # Return the top `max_suggestions` recipe names
    return sorted_df['name'].head(max_suggestions).tolist()

# Custom CSS


#   - Recommendations are automatically diversified to offer you a broader variety of results.



st.write('---')

st.markdown(
    """
    ## Find Your Perfect Recipe
    """
)
option = st.selectbox(
    'How would you like to search for recipes?',
    ('Personalized Recommendations', 'Popular Searches', 'Custom Search')
)


if option == 'Personalized Recommendations':
    #st.header('Get Recommendations')

    st.write(
"""
    ### **Get Recommendations**
""") 
    
    # Input field with suggestions
    user_input = st.text_input('Enter a Recipe Name')
    
    suggestions = []
    if user_input:
        suggestions = autocomplete_suggestions(user_input, df)

    selected_recipe = None
    if suggestions:
        st.write("Did you mean:")
        for suggestion in suggestions:
            if st.button(suggestion):
                selected_recipe = suggestion
                break  # Exit the loop once a selection is made

    if selected_recipe:
        #top_n = st.slider('Number of Recommendations', 1, 10, 5)
        #diversify = st.checkbox('Diversify Recommendations')
        
        similar_recipes = get_similar_recipes(selected_recipe, top_n=10, diversify=0)
        st.write(f"Top {10} recommendations for '{selected_recipe}':")
        st.dataframe(similar_recipes.reset_index(drop=True).reset_index(drop=False).rename(columns={'index': 'Rank'}).assign(Rank=lambda x: x.index + 1), hide_index=True)

        st.write("#### Learn More")
        st.markdown("[![](https://img.shields.io/badge/GitHub%20-Recipes%20Recommender-informational)](https://github.com/akthammomani/AI_Powered_Recipe_Recommender/tree/main/Notebooks/Modeling)")
    
    elif user_input and not selected_recipe:
        if st.button('Get Recommendations'):
            st.warning('No matching recipes found. Please try again.')


    #st.header('Search Recipes')

st.write(
"""
### **Search Recipes**
""") 

category = st.selectbox('Category', [
'appetizers-and-snacks', 'desserts', 'world-cuisine', 'main-dish', 
'side-dish', 'bread', 'soups-stews-and-chili', 'meat-and-poultry', 
'salad', 'seafood', 'breakfast-and-brunch', 'trusted-brands-recipes-and-tips', 
'everyday-cooking', 'fruits-and-vegetables', 'pasta-and-noodles', 
'drinks', 'holidays-and-events', 'bbq-grilling'
])

diet_type = st.selectbox('Diet Type', [
'General', 'High Protein', 'Low Carb, Low Sugar', 'Low Carb, High Protein, Low Sugar',
'High Protein, Low Sugar', 'Low Fat', 'Low Sugar', 'Low Carb, Low Fat, Low Sugar',
'Low Fat, Low Sugar', 'Low Carb, Low Fat, Low Sodium, Low Sugar', 'Low Fat, Low Sodium',
'Low Carb, Low Fat, Low Sodium', 'Low Sodium', 'Low Carb, High Protein', 'Low Carb',
'Low Carb, Low Fat', 'Low Carb, Low Fat, High Protein, Low Sugar', 'Low Fat, High Protein',
'Low Carb, Low Sodium, Low Sugar', 'Low Fat, Low Sodium, Low Sugar',
'Low Fat, High Protein, Low Sugar', 'Low Carb, Low Sodium', 'Low Carb, Low Fat, High Protein',
'Low Sodium, Low Sugar', 'Low Carb, High Protein, Low Sodium, Low Sugar',
'Low Carb, Low Fat, High Protein, Low Sodium, Low Sugar', 'High Protein, Low Sodium, Low Sugar',
'High Protein, Low Sodium', 'Low Carb, High Protein, Low Sodium', 'Low Fat, High Protein, Low Sodium',
'Low Fat, High Protein, Low Sodium, Low Sugar', 'Low Carb, Low Fat, High Protein, Low Sodium'
])

ingredients = st.text_input('Ingredients (comma-separated)')

serving_one = st.checkbox('Cooking for One')
serving_two = st.checkbox('Cooking for Two')
serving_crowd = st.checkbox('Cooking for a Crowd')

quick_and_easy = st.checkbox('Quick and Easy Recipes')

#num_results = st.slider('Number of Results to Show', 1, 50, 10)

if st.button('Search'):
query_parts = []
if category:
    query_parts.append(f'category == "{category}"')

if diet_type and diet_type != 'General':  # Apply diet type filter if selected
    query_parts.append(f'diet_type == "{diet_type}"')

if ingredients:
    ingredients_list = ingredients.split(',')
    ingredients_query = ' & '.join([f'high_level_ingredients_str.str.contains("{ingredient.strip()}")' for ingredient in ingredients_list])
    query_parts.append(ingredients_query)

# Apply serving size filter
if serving_one:
    query_parts.append('servings == 1')
if serving_two:
    query_parts.append('servings == 2')
if serving_crowd:
    query_parts.append('servings >= 5')

# Apply quick and easy filter
if quick_and_easy:
    query_parts.append('cook_time_mins <= 15')

query = " & ".join(query_parts)

# Print the query for debugging purposes
#st.write(f"Query: {query}")

if query:
    # Filter the DataFrame
    filtered_recipes = df.query(query)
    
    # No need to sort again since df is already sorted
    st.write(f"Showing top {10} results for the given filters:")
    #st.write(filtered_recipes.head(num_results))
    selected_columns = ['name', 'category', 'ingredients', 'directions','rating', 'rating_count', 'diet_type','calories', 'servings', 'Carbohydrates g(Daily %)', 'Sugars g(Daily %)', 'Fat g(Daily %)', 'Protein g(Daily %)', 'cook']
    filtered_recipes = filtered_recipes.sort_values(by=['rating_count', 'rating'], ascending=False)
    filtered_recipes = filtered_recipes[selected_columns]
    filtered_recipes = filtered_recipes.rename(columns=friendly_names)
    st.dataframe(filtered_recipes.reset_index(drop=True).reset_index(drop=False).rename(columns={'index': 'Rank'}).assign(Rank=lambda x: x.index + 1), hide_index=True)
else:
    st.warning('Please enter at least one filter.')


#null9_0, row9_1, row9_2 = st.columns((0, 5, 0.05))


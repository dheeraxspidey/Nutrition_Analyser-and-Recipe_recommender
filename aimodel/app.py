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
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:5500"}})




# Load the saved models and components
with open('C:/Users/22071/Desktop/nutrition/aimodel/recipe_recommendation_model.pkl', 'rb') as file:
    model = pickle.load(file)

with open('C:/Users/22071/Desktop/nutrition/aimodel/pca_model.pkl', 'rb') as file:
    pca = pickle.load(file)

with open('C:/Users/22071/Desktop/nutrition/aimodel/tfidf_vectorizer.pkl', 'rb') as file:
    tfidf = pickle.load(file)
def load_data(filepath):
    return pd.read_csv(filepath)

# Use the cached function to load the data
df = load_data('C:/Users/22071/Desktop/nutrition/aimodel/all_recipes_final_df_v2.csv')
def autocomplete_suggestions(user_input):
    filtered_df = df[df['name'].str.contains(user_input, case=False, na=False)]
    sorted_df = filtered_df.sort_values(by='rating_count', ascending=False)
    return sorted_df['name'].head(5).tolist()
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

# Function to filter recipes
def filter_recipes(category, diet_type, ingredients, servings, quick_and_easy):
    query_parts = []
    if category:
        query_parts.append(f'category == "{category}"')
    if diet_type and diet_type != 'General':
        query_parts.append(f'diet_type == "{diet_type}"')
    if ingredients:
        ingredients_list = ingredients.split(',')
        ingredients_query = ' & '.join([f'high_level_ingredients_str.str.contains("{ingredient.strip()}")' for ingredient in ingredients_list])
        query_parts.append(ingredients_query)
    if servings.get('one'):
        query_parts.append('servings == 1')
    if servings.get('two'):
        query_parts.append('servings == 2')
    if servings.get('crowd'):
        query_parts.append('servings >= 5')
    if quick_and_easy:
        query_parts.append('cook_time_mins <= 15')

    query = " & ".join(query_parts)
    filtered_recipes = df.query(query).sort_values(by=['rating_count', 'rating'], ascending=False)
    return filtered_recipes.to_dict(orient='records')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/autocomplete', methods=['GET'])
def autocomplete():
    query = request.args.get('query')
    print(query)
    suggestions = autocomplete_suggestions(query)
    return jsonify({'suggestions': suggestions})

@app.route('/recommend', methods=['POST'])
def recommend():
    recipe_name = request.form['recipe_name']
    recommendations_json = get_similar_recipes(recipe_name)
    
    
    recommendations_json = recommendations_json.to_dict(orient='records')
    for i, recipe in enumerate(recommendations_json):
        recipe['Recipe ID'] = i

    
    return jsonify({'recipes': recommendations_json})

@app.route('/filter', methods=['POST'])
def filter():
    category = request.form['category']
    diet_type = request.form['diet_type']
    ingredients = request.form['ingredients']
    servings = {
        'one': 'serving_one' in request.form,
        'two': 'serving_two' in request.form,
        'crowd': 'serving_crowd' in request.form
    }
    quick_and_easy = 'quick_and_easy' in request.form
    filtered_recipes = filter_recipes(category, diet_type, ingredients, servings, quick_and_easy)
    return {'recipes': filtered_recipes}

if __name__ == '__main__':
    app.run(debug=True)

# from flask import Flask, render_template, request, jsonify
# import pandas as pd
# import pickle
# import numpy as np
# from sklearn.metrics.pairwise import cosine_similarity
# from flask_cors import CORS

# app = Flask(__name__)
# CORS(app)  # Enable CORS
# with open('C:/Users/22071/Desktop/nutrition/aimodel/recipe_recommendation_model.pkl', 'rb') as file:
#     model = pickle.load(file)

# with open('C:/Users/22071/Desktop/nutrition/aimodel/pca_model.pkl', 'rb') as file:
#     pca = pickle.load(file)

# with open('C:/Users/22071/Desktop/nutrition/aimodel/tfidf_vectorizer.pkl', 'rb') as file:
#     tfidf = pickle.load(file)


# # Load the saved models and components


# # Load the recipes data
# df = pd.read_csv('C:/Users/22071/Desktop/nutrition/aimodel/all_recipes_final_df_v2.csv')
# print(df.head())  # Debugging line to check the data

# # Function to get autocomplete suggestions
# def autocomplete_suggestions(user_input):
#     filtered_df = df[df['name'].str.contains(user_input, case=False, na=False)]
#     print("Filtered suggestions:", filtered_df['name'].tolist())  # Debugging line
#     sorted_df = filtered_df.sort_values(by='rating_count', ascending=False)
#     return sorted_df['name'].head(5).tolist()

# # Function to filter recipes
# def filterRecipes(user_input):
#     print("Filtering recipes for:", user_input)  # Debugging line
#     filtered_df = df[df['name'].str.contains(user_input, case=False, na=False)]
#     return filtered_df.to_dict('records')

# @app.route('/')
# def index():
#     return render_template('index.html')

# @app.route('/autocomplete', methods=['GET'])
# def autocomplete():
#     query = request.args.get('query')
#     print("Autocomplete query:", query)  # Debugging line
#     suggestions = autocomplete_suggestions(query)
#     return jsonify({'suggestions': suggestions})

# @app.route('/filter', methods=['GET'])
# def filter():
#     query = request.args.get('query')
#     print("Filter query:", query)  # Debugging line
#     filtered_recipes = filterRecipes(query)
#     return jsonify({'recipes': filtered_recipes})

# if __name__ == '__main__':
#     app.run(debug=True)
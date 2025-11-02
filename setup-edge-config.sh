#!/bin/bash

# Script pour configurer Edge Config sur Vercel
echo "Configuration de EDGE_CONFIG pour Vercel..."

# Ajouter la variable d'environnement
vercel env add EDGE_CONFIG

# Répondre aux questions:
# What's the value of EDGE_CONFIG? -> ecfg_puwsypw5sv3zviw427nirgf4clyg
# In which environments should this variable be available? -> production,preview,development

echo "Variable d'environnement configurée!"
echo "Redéployez votre application avec: vercel --prod"
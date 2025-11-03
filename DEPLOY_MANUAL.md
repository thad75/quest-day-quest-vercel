# Guide de Déploiement Manuel

Le CI GitHub ne fonctionne pas actuellement, donc les déploiements automatiques ne se déclenchent pas. Voici comment déployer manuellement :

## Option 1 : Via le Dashboard Vercel (RECOMMANDÉ)

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet `quest-day-quest-vercel`
3. Cliquez sur l'onglet "Deployments"
4. Cliquez sur le bouton "Redeploy" sur le dernier déploiement
5. Ou cliquez sur "Deploy" → "Deploy from GitHub" pour forcer un nouveau déploiement

## Option 2 : Via Vercel CLI (Local)

### 1. Authentification
```bash
vercel login
```
Suivez les instructions pour vous connecter.

### 2. Lier le projet (première fois seulement)
```bash
vercel link
```
Sélectionnez votre projet existant.

### 3. Déployer
```bash
# Déploiement de production
vercel --prod

# Ou déploiement de prévisualisation
vercel
```

## Option 3 : Réparer la Connexion GitHub → Vercel

### Vérifier les Webhooks GitHub

1. Allez sur GitHub : `https://github.com/thad75/quest-day-quest-vercel/settings/hooks`
2. Vérifiez qu'il y a un webhook Vercel
3. Si absent ou en erreur, reconnectez depuis Vercel :
   - Dashboard Vercel → Project Settings → Git
   - Cliquez sur "Reconnect to GitHub"

### Vérifier les Permissions GitHub

1. Vercel Dashboard → Settings → Git Integrations
2. Assurez-vous que l'intégration GitHub est active
3. Vérifiez les permissions pour le repository

## Option 4 : Forcer le Redéploiement avec un Commit Vide

```bash
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin main
```

Si le webhook fonctionne, cela devrait déclencher un déploiement.

## Vérifier que le Déploiement a Fonctionné

1. Vérifiez sur Vercel Dashboard que le déploiement est "Ready"
2. Testez l'API :
   ```bash
   curl https://quest-day-quest-vercel.vercel.app/api/blob/quests-new
   ```
3. Vérifiez que la console log affiche : `"API: quests-new.js loaded successfully - v2.1"`
4. Hard refresh le navigateur (`Ctrl+Shift+R` ou `Cmd+Shift+R`)

## Problèmes Connus

- **Cache Vercel** : Les fonctions serverless peuvent être cachées. Attendez 1-2 minutes après le déploiement.
- **Cache Navigateur** : Faites toujours un hard refresh après déploiement.
- **Variables d'environnement** : Assurez-vous que `BLOB_READ_WRITE_TOKEN` est configuré dans Vercel.

## Contact

Si les problèmes persistent :
1. Vérifiez les logs Vercel : Dashboard → Project → Deployments → Logs
2. Vérifiez les variables d'environnement : Dashboard → Project → Settings → Environment Variables

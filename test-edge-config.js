// Test simple pour Edge Config selon la doc Vercel
import { get, createClient } from '@vercel/edge-config';

console.log('🧪 Test Edge Config - Documentation Vercel');

// Test 1: Créer un client direct
console.log('\n1. Test création client direct...');
try {
  const client = createClient('ecfg_puwsypw5sv3zviw427nirgf4clyg');
  console.log('✅ Client créé avec succès');

  // Test 2: Essayer de lire une clé
  console.log('\n2. Test lecture clé "users"...');
  client.get('users').then(result => {
    console.log('✅ Résultat:', result);
  }).catch(error => {
    console.log('❌ Erreur:', error.message);
  });

} catch (error) {
  console.log('❌ Erreur création client:', error.message);
}

// Test 3: Utiliser les fonctions globales
console.log('\n3. Test fonctions globales...');
try {
  get('users').then(result => {
    console.log('✅ Résultat global:', result);
  }).catch(error => {
    console.log('❌ Erreur globale:', error.message);
  });
} catch (error) {
  console.log('❌ Erreur import global:', error.message);
}

// Test 4: Vérifier l'environnement
console.log('\n4. Vérification environnement...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EDGE_CONFIG existe:', !!process.env.EDGE_CONFIG);
console.log('EDGE_CONFIG valeur:', process.env.EDGE_CONFIG);

console.log('\n🏁 Test terminé');
exports.handler = async (event) => {
  const { songName } = JSON.parse(event.body);
  // Logique API ici (même que /analyze)
  return { statusCode: 200, body: JSON.stringify({ mood: 'joy' }) }; // Test
};
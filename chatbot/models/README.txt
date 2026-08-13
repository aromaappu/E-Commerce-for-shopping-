MODELS FOLDER
============

The SmolLM2-360M-Instruct-Q2_K.gguf file is not used by the bot.
Supabase Edge Functions (where the bot runs) have no GPU and not enough
memory to load model files, so .gguf files cannot run there.

The bot answers from YOUR database (orders, products, sales) using its
built-in rules. You can delete this .gguf file to save 218MB of space.

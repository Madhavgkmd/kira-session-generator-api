# Node.js 20 ഉപയോഗിക്കുന്നു (പുതിയ Baileys വേർഷന് ഇത് നിർബന്ധമാണ്)
FROM node:20-bullseye-slim

# ആപ്പ് റൺ ചെയ്യാനുള്ള ഫോൾഡർ സെറ്റ് ചെയ്യുന്നു
WORKDIR /app

# Package.json കോപ്പി ചെയ്ത് ഇൻസ്റ്റാൾ ചെയ്യുന്നു
COPY package*.json ./
RUN npm install

# ബാക്കി എല്ലാ ഫയലുകളും കോപ്പി ചെയ്യുന്നു
COPY . .

# Hugging Face ഉപയോഗിക്കുന്ന പോർട്ട് തുറക്കുന്നു
EXPOSE 7860

# ആപ്പ് സ്റ്റാർട്ട് ചെയ്യാനുള്ള കമാൻഡ്
CMD ["node", "server.js"]
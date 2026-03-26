# جيب النسخة ديال Node.js
FROM node:18-alpine

# كريي الدوسي فين غيخدم السيت
WORKDIR /usr/src/app

# كوبي ملفات المكتبات
COPY package*.json ./

# أنسطالي المكتبات
RUN npm install

# كوبي الكود ديالك كامل
COPY . .

# حل البورت 5000
EXPOSE 5000

# شعل السيرفر
CMD ["node", "server.js"]
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const Person = require('./models/Person');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// --- TWO-TIER PASSWORDS ---
const VIEW_PASSWORD = 'FamilyView2026';  // For everyone to look
const EDIT_PASSWORD = 'SakhalkarAdmin';  // For the handful of editors

// --- AUTHENTICATION ENDPOINT ---
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (password === EDIT_PASSWORD) {
    return res.json({ role: 'edit' });
  } else if (password === VIEW_PASSWORD) {
    return res.json({ role: 'view' });
  } else {
    return res.status(401).json({ error: 'Incorrect password' });
  }
});

// --- SECURITY MIDDLEWARE ---
const requireViewAccess = (req, res, next) => {
  const token = req.headers['x-family-password'];
  if (token === VIEW_PASSWORD || token === EDIT_PASSWORD) {
    next(); 
  } else {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid view password' });
  }
};

const requireEditAccess = (req, res, next) => {
  const token = req.headers['x-family-password'];
  if (token === EDIT_PASSWORD) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Edit access required' });
  }
};

mongoose.connect('mongodb+srv://Tejas:Sanejas1603@sakhalkartree.dlth3eg.mongodb.net/familytree?appName=SakhalkarTree');

// GET routes require at least View access
app.get('/api/family', requireViewAccess, async (req, res) => {
  try {
    const family = await Person.find().populate('children father mother spouse');
    res.json(family);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST and PUT routes strictly require Edit access
app.post('/api/family', requireEditAccess, upload.single('image'), async (req, res) => {
  try {
    const { firstName, lastName, gender, dateOfBirth, dateOfDeath, location, occupation, bio, father, mother, spouse } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const newPerson = new Person({ 
      firstName, lastName, gender, dateOfBirth, dateOfDeath, location, occupation, bio, imageUrl,
      father: father || null, mother: mother || null, spouse: spouse || null 
    });
    
    await newPerson.save();

    if (father) await Person.findByIdAndUpdate(father, { $push: { children: newPerson._id } });
    if (mother) await Person.findByIdAndUpdate(mother, { $push: { children: newPerson._id } });
    if (spouse) await Person.findByIdAndUpdate(spouse, { spouse: newPerson._id });

    res.status(201).json(newPerson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/family/:id', requireEditAccess, upload.single('image'), async (req, res) => {
  try {
    const { firstName, lastName, gender, dateOfBirth, dateOfDeath, location, occupation, bio, father, mother, spouse } = req.body;
    const personId = req.params.id;
    
    const updateData = { firstName, lastName, gender, dateOfBirth, dateOfDeath, location, occupation, bio };
    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

    const existingPerson = await Person.findById(personId);

    if (father !== undefined && father !== existingPerson.father?.toString()) {
      if (existingPerson.father) await Person.findByIdAndUpdate(existingPerson.father, { $pull: { children: personId } });
      if (father) await Person.findByIdAndUpdate(father, { $push: { children: personId } });
      updateData.father = father || null;
    }

    if (mother !== undefined && mother !== existingPerson.mother?.toString()) {
      if (existingPerson.mother) await Person.findByIdAndUpdate(existingPerson.mother, { $pull: { children: personId } });
      if (mother) await Person.findByIdAndUpdate(mother, { $push: { children: personId } });
      updateData.mother = mother || null;
    }

    if (spouse !== undefined && spouse !== existingPerson.spouse?.toString()) {
      if (existingPerson.spouse) await Person.findByIdAndUpdate(existingPerson.spouse, { spouse: null });
      if (spouse) await Person.findByIdAndUpdate(spouse, { spouse: personId });
      updateData.spouse = spouse || null;
    }

    const updatedPerson = await Person.findByIdAndUpdate(personId, updateData, { returnDocument: 'after' });
    res.json(updatedPerson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
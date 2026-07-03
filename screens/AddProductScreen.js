import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';

const UNIT_OPTIONS = ['piece', 'kg', 'liter', 'pack', 'box', 'dozen', 'other'];

const AddProductScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');               // wholesale price
  const [retailPrice, setRetailPrice] = useState('');    // NEW: retail price
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('piece');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);

  // Global categories
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    fetchGlobalCategories();
  }, []);

  const fetchGlobalCategories = async () => {
    try {
      const { data } = await api.get('/categories/global');
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!name.trim() || !price.trim() || !category) {
      Alert.alert('Required', 'Please fill in name, category, and price.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/products', {
        name: name.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        retailPrice: Number(retailPrice) || 0,     // send retail price (0 if empty)
        stock: Number(stock) || 0,
        unit,
        weight: weight ? Number(weight) : undefined,
      });
      Alert.alert('Success', 'Product added and sent for approval', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Form Card */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Product Details</Text>

        {/* Product Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Fresh Mangoes"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Product description"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          {categoriesLoading ? (
            <ActivityIndicator size="small" color="#1e40af" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={[
                    styles.categoryChip,
                    category === cat.name && styles.categoryChipSelected,
                  ]}
                  onPress={() => setCategory(cat.name)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat.name && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Unit */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Unit *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {UNIT_OPTIONS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[
                  styles.categoryChip,
                  unit === u && styles.categoryChipSelected,
                ]}
                onPress={() => setUnit(u)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    unit === u && styles.categoryChipTextSelected,
                  ]}
                >
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Wholesale Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Wholesale Price (Rs.) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="80"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
          />
        </View>

        {/* Retail Price (NEW) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Retail Price (Rs.)</Text>
          <TextInput
            style={styles.input}
            value={retailPrice}
            onChangeText={setRetailPrice}
            placeholder="100"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
          />
        </View>

        {/* Stock */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Stock</Text>
          <TextInput
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            placeholder="100"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
          />
        </View>

        {/* Weight (optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weight (kg) – optional</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="0.5"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleAddProduct}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Add Product</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: '#1e293b',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  placeholder: {
    width: 40,
  },
  // Form Card
  formCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#eef2f6',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 90,
    paddingTop: 14,
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  categoryChipSelected: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});

export default AddProductScreen;
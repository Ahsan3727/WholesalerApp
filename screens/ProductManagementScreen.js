import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';

export default function ProductManagementScreen({ navigation, route }) {
  const productFromParams = route.params?.product;
  const onRefresh = route.params?.onRefresh; // callback to refresh parent list

  const [product, setProduct] = useState(productFromParams || null);
  const [loading, setLoading] = useState(false);

  // Editable fields
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(String(product?.price || ''));
  const [retailPrice, setRetailPrice] = useState(String(product?.retailPrice || ''));
  const [stock, setStock] = useState(String(product?.stock || ''));
  const [category, setCategory] = useState(product?.category || '');
  const [description, setDescription] = useState(product?.description || '');
  const [unit, setUnit] = useState(product?.unit || 'piece');
  const [weight, setWeight] = useState(String(product?.weight || ''));

  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Not Found</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#94a3b8' }}>No product selected</Text>
        </View>
      </View>
    );
  }

  const handleUpdate = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Required', 'Name and price are required');
      return;
    }
    setLoading(true);
    try {
      const newPrice = Number(price);
      // ⚠️ If your backend uses a different route (e.g. /products/update/:id),
      // change the URL accordingly. The common RESTful pattern is PUT /products/:id.
      await api.put(`/products/${product._id}`, {
        name: name.trim(),
        price: newPrice,
        wholesalerPrice: newPrice,
        retailPrice: Number(retailPrice) || 0,
        stock: Number(stock) || 0,
        category: category.trim(),
        description: description.trim(),
        unit,
        weight: weight ? Number(weight) : undefined,
      });
      Alert.alert('Success', 'Product updated', [
        {
          text: 'OK',
          onPress: () => {
            // Refresh parent list if callback exists, then go back
            if (onRefresh) onRefresh();
            navigation.goBack();
          },
        },
      ]);
    } catch (err) {
      const message = err.response?.data?.message || 'Update failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.delete(`/products/${product._id}`);
              Alert.alert('Deleted', 'Product removed', [
                {
                  text: 'OK',
                  onPress: () => {
                    if (onRefresh) onRefresh();
                    navigation.goBack();
                  },
                },
              ]);
            } catch (err) {
              const message = err.response?.data?.message || 'Delete failed';
              Alert.alert('Error', message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Form Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Product Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Product name"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="Category"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Wholesale Price (Rs.) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Retail Price (Rs.)</Text>
            <TextInput
              style={styles.input}
              value={retailPrice}
              onChangeText={setRetailPrice}
              placeholder="0"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Stock</Text>
            <TextInput
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              placeholder="0"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Unit</Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={setUnit}
              placeholder="piece"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.updateButton, loading && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>Update Product</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={loading}
        >
          <Text style={styles.deleteButtonText}>Delete Product</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { paddingBottom: 40 },
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
  backArrow: { fontSize: 20, color: '#1e293b', fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', letterSpacing: -0.4 },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#eef2f6',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: { minHeight: 80, paddingTop: 12 },
  row: { flexDirection: 'row' },
  updateButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  updateButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  deleteButton: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});
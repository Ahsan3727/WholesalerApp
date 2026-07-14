import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const STATUS_COLORS = {
  pending: '#f59e0b',
  approved: '#22c55e',
  rejected: '#ef4444',
};

const MyProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalCategories, setGlobalCategories] = useState([]);

  // Filters & sorting
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Load data function (used for both initial load and refresh)
  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products/my'),
        api.get('/categories/global'),
      ]);
      setProducts(productsRes.data.products || []);
      setGlobalCategories(categoriesRes.data.categories || []);
    } catch (error) {
      console.error('Error loading data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Refresh when screen comes into focus (e.g., after returning from edit)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Manual refresh (pull-to-refresh)
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  // Build category list
  const categories = useMemo(() => {
    const cats = globalCategories.map(c => c.name).filter(Boolean);
    return ['All', ...cats.sort()];
  }, [globalCategories]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query)
      );
    }

    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }

    result.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'price':
          valA = a.wholesalerPrice || a.price || 0;
          valB = b.wholesalerPrice || b.price || 0;
          break;
        case 'stock':
          valA = a.stock || 0;
          valB = b.stock || 0;
          break;
        case 'status':
          valA = a.status || '';
          valB = b.status || '';
          break;
        default:
          valA = a.name || '';
          valB = b.name || '';
      }
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [products, search, activeCategory, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStockColor = (stock) => {
    if (!stock) return '#ef4444';
    if (stock < 20) return '#f59e0b';
    return '#22c55e';
  };

  const renderProduct = ({ item }) => {
    const status = (item.status || '').toLowerCase();
    const statusColor = STATUS_COLORS[status] || '#94a3b8';
    const stockColor = getStockColor(item.stock);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('ProductManagement', {
            product: item,
            onRefresh: loadData, // pass refresh callback
          })
        }
      >
        <View style={styles.thumbnailBox}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderThumb}>
              <Text style={styles.placeholderIcon}>📷</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.category}>{item.category || 'Uncategorised'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status}
              </Text>
            </View>
          </View>

          <View style={styles.cardBottom}>
            {/* ===== UPDATED PRICE BLOCK (now uses price field as primary) ===== */}
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>
                Rs. {item.price ?? item.wholesalerPrice ?? 0}
              </Text>
            </View>
            {/* ================================================================= */}
            <View style={styles.stockBlock}>
              <Text style={styles.stockLabel}>Stock</Text>
              <View style={[styles.stockBadge, { backgroundColor: stockColor + '18' }]}>
                <Text style={[styles.stockText, { color: stockColor }]}>
                  {item.stock || 0} {item.unit || 'units'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddProduct')}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearch('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Chips */}
      <View style={styles.categoryRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, activeCategory === cat && styles.chipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'name' && styles.sortChipActive]}
          onPress={() => toggleSort('name')}
        >
          <Text style={[styles.sortText, sortBy === 'name' && styles.sortTextActive]}>
            Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'price' && styles.sortChipActive]}
          onPress={() => toggleSort('price')}
        >
          <Text style={[styles.sortText, sortBy === 'price' && styles.sortTextActive]}>
            Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'stock' && styles.sortChipActive]}
          onPress={() => toggleSort('stock')}
        >
          <Text style={[styles.sortText, sortBy === 'stock' && styles.sortTextActive]}>
            Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item._id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtext}>
                {search ? 'Try a different search' : 'Tap + to add products'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: { fontSize: 22, color: '#ffffff', fontWeight: '600', marginTop: -1 },
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  clearButton: { paddingHorizontal: 14, paddingVertical: 12 },
  clearText: { fontSize: 18, color: '#94a3b8', fontWeight: '600' },
  categoryRow: { marginBottom: 8, paddingLeft: 20 },
  chipsContent: { paddingRight: 20 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#1e40af', borderColor: '#1e40af' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#ffffff' },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sortLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginRight: 10 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortChipActive: { backgroundColor: '#e0e7ff', borderColor: '#818cf8' },
  sortText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  sortTextActive: { color: '#4f46e5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eef2f6',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumb: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
  cardContent: {
    flex: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  productName: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 10 },
  category: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  priceBlock: { flex: 1 },
  stockBlock: { flex: 1, alignItems: 'flex-end' },
  priceLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  priceValue: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  stockLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 2 },
  stockText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#64748b', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#94a3b8' },
});

export default MyProductsScreen;
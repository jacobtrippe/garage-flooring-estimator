'use client';

import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#2f2f30',
    padding: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    color: '#ffffff',
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerRight: {
    textAlign: 'right',
  },
  estimateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  estimateDate: {
    fontSize: 11,
    color: '#cccccc',
  },
  section: {
    padding: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2f2f30',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  customerInfo: {
    marginBottom: 24,
  },
  customerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  customerDetails: {
    fontSize: 11,
    color: '#333333',
    lineHeight: 1.5,
  },
  table: {
    marginBottom: 24,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  tableRowHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  tableColName: {
    flex: 1,
    fontSize: 11,
  },
  tableColPrice: {
    width: 100,
    textAlign: 'right',
    fontSize: 11,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderTop: '2px solid #2f2f30',
    marginBottom: 40,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2f2f30',
    marginRight: 40,
    width: 60,
    textAlign: 'right',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f2f30',
    width: 100,
    textAlign: 'right',
  },
  signatureSection: {
    paddingHorizontal: 30,
    paddingBottom: 30,
    borderTop: '1px solid #e0e0e0',
    paddingTop: 30,
  },
  signatureTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2f2f30',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  signatureContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureImage: {
    width: 150,
    height: 80,
    borderBottom: '2px solid #2f2f30',
  },
  signatureDate: {
    textAlign: 'right',
  },
  signatureDateLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 4,
  },
  signatureDateValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2f2f30',
  },
});

interface EstimatePDFProps {
  customer: {
    id: string;
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
  };
  items: Array<{
    productId: string;
    name: string;
    totalPrice: number;
  }>;
  totalPrice: number;
  signatureDataUrl?: string;
  estimateId: string;
  date: string;
}

export default function EstimatePDF({
  customer,
  items,
  totalPrice,
  signatureDataUrl,
  estimateId,
  date,
}: EstimatePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src="/logo.jpg" style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.estimateTitle}>ESTIMATE</Text>
            <Text style={styles.estimateDate}>#{estimateId.slice(-8).toUpperCase()}</Text>
            <Text style={styles.estimateDate}>{date}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prepared For</Text>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerDetails}>
              {customer.street}
            </Text>
            <Text style={styles.customerDetails}>
              {customer.city}, {customer.state} {customer.zip}
            </Text>
            <Text style={styles.customerDetails}>{customer.phone}</Text>
            <Text style={styles.customerDetails}>{customer.email}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableRowHeader]}>
              <Text style={styles.tableColName}>Description</Text>
              <Text style={styles.tableColPrice}>Amount</Text>
            </View>
            {items.filter(item => item.totalPrice > 0).map((item, idx) => (
              <View key={item.productId} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                <Text style={styles.tableColName}>{item.name}</Text>
                <Text style={styles.tableColPrice}>${item.totalPrice.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureTitle}>Authorization</Text>
          <View style={styles.signatureContent}>
            {signatureDataUrl && (
              <Image src={signatureDataUrl} style={styles.signatureImage} />
            )}
            <View style={styles.signatureDate}>
              <Text style={styles.signatureDateLabel}>Date</Text>
              <Text style={styles.signatureDateValue}>{date}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

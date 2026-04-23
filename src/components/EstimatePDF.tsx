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
    padding: 25,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#ffffff',
    gap: 20,
  },
  headerLeft: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 55,
    height: 55,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  headerCenter: {
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    textAlign: 'right',
    justifyContent: 'flex-start',
  },
  estimateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  estimateNumber: {
    fontSize: 9,
    color: '#bbbbbb',
    marginBottom: 3,
    fontWeight: 'normal',
  },
  estimateDate: {
    fontSize: 9,
    color: '#bbbbbb',
    fontWeight: 'normal',
  },
  section: {
    padding: 20,
  },
  headerInfoSection: {
    padding: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 30,
  },
  infoColumn: {
    flex: 1,
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
    marginBottom: 0,
  },
  presentedByInfo: {
    marginBottom: 0,
  },
  scopeSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
    borderTop: '1px solid #e0e0e0',
    paddingTop: 8,
  },
  scopeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2f2f30',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scopeSubtitle: {
    fontSize: 10,
    color: '#333333',
    marginBottom: 12,
    lineHeight: 1.5,
  },
  scopePackage: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2f2f30',
    marginTop: 8,
    marginBottom: 6,
  },
  scopeList: {
    fontSize: 9,
    color: '#333333',
    lineHeight: 1.6,
    marginLeft: 0,
  },
  scopeCompletion: {
    fontSize: 9,
    color: '#333333',
    marginTop: 8,
    fontStyle: 'italic',
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
    paddingVertical: 12,
    borderTop: '2px solid #2f2f30',
    marginBottom: 20,
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
  paymentSection: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 15,
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2f2f30',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 8,
    fontSize: 10,
  },
  paymentLabel: {
    flex: 1,
    color: '#333333',
  },
  paymentAmount: {
    width: 80,
    textAlign: 'right',
    fontWeight: 'bold',
    color: '#2f2f30',
  },
  expectationSection: {
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  expectationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2f2f30',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  expectationList: {
    fontSize: 9,
    color: '#333333',
    lineHeight: 1.6,
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
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src="/logo.jpg" style={styles.logo} />
            <Text style={styles.companyName}>PLATINUM INSTALLS</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.estimateTitle}>Garage Floor Proposal</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.estimateNumber}>Proposal #{estimateId.slice(-8).toUpperCase()}</Text>
            <Text style={styles.estimateDate}>{date}</Text>
          </View>
        </View>

        {/* Customer Info & Presented By */}
        <View style={styles.headerInfoSection}>
          <View style={styles.infoColumn}>
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
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>Presented By</Text>
            <View style={styles.presentedByInfo}>
              <Text style={styles.customerName}>Jacob Trippe</Text>
              <Text style={styles.customerDetails}>Platinum Installs</Text>
              <Text style={styles.customerDetails}>(949) 289-4375</Text>
              <Text style={styles.customerDetails}>jtplatinstalls.com</Text>
            </View>
          </View>
        </View>

        {/* Project Summary */}
        <View style={styles.scopeSection}>
          <Text style={styles.scopeTitle}>Project Summary</Text>
          <Text style={styles.scopeSubtitle}>
            This proposal includes a complete garage floor coating system designed for a clean, modern appearance and long-term durability. Designed for homeowners wanting a high-end finish with a professional installation experience from start to finish.
          </Text>
          <Text style={styles.scopePackage}>Scope of Service</Text>
          <Text style={styles.scopeList}>
            • Professional surface preparation (diamond grinding){'\n'}
            • Standard crack and joint repair (as needed){'\n'}
            • Epoxy base coat for adhesion and coverage{'\n'}
            • Decorative flake broadcast for a premium finish{'\n'}
            • Polyaspartic top coat for durability, gloss, and stain resistance{'\n'}
            • Clean edge work and detail finishing
          </Text>
          <Text style={styles.scopeCompletion}>
            Typical Completion Time: Most garages are completed in 1 day, depending on concrete condition and weather.
          </Text>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableRowHeader]}>
              <Text style={styles.tableColName}>Description</Text>
              <Text style={styles.tableColPrice}>Amount</Text>
            </View>
            {items.map((item, idx) => (
              <View key={item.productId} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                <Text style={styles.tableColName}>{item.name}</Text>
                <Text style={styles.tableColPrice}>{item.totalPrice !== 0 ? `${item.totalPrice < 0 ? '-$' : '$'}${Math.abs(item.totalPrice).toFixed(2)}` : ''}</Text>
              </View>
            ))}
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ padding: 20 }}>
          {/* Scheduling & Payment */}
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Scheduling & Payment</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Deposit to Schedule:</Text>
              <Text style={styles.paymentAmount}>${(totalPrice / 2).toFixed(2)}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Final Payment Due at Completion:</Text>
              <Text style={styles.paymentAmount}>${(totalPrice / 2).toFixed(2)}</Text>
            </View>
          </View>

          {/* What to Expect */}
          <View style={styles.expectationSection}>
            <Text style={styles.expectationTitle}>What to Expect</Text>
            <Text style={styles.expectationList}>
              1) Sign customer agreement{'\n'}
              2) Confirm your preferred install date{'\n'}
              3) Choose your design (base + flake color){'\n'}
              4) Provide prep instructions (simple and quick){'\n'}
              5) Arrive on time and complete the installation efficiently{'\n'}
              6) Walk the finished floor with you before closeout
            </Text>
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
        </View>
      </Page>
    </Document>
  );
}

'use client';

import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  headerText: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  tagline: {
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '35%',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: '#333333',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 2,
  },
  scopeSection: {
    marginBottom: 12,
  },
  scopeTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  scopeText: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.5,
    marginBottom: 8,
  },
  numberSection: {
    marginBottom: 12,
  },
  numberTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  numberContent: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.6,
    marginLeft: 10,
  },
  priceRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  priceLabel: {
    flex: 1,
    fontSize: 10,
    color: '#333333',
  },
  priceValue: {
    width: 80,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
  },
  signatureSection: {
    marginTop: 30,
    marginBottom: 10,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  signatureBlock: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 8,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#000000',
    fontWeight: 'bold',
  },
  dateField: {
    fontSize: 9,
    color: '#000000',
    marginTop: 4,
  },
  footer: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
  },
  footerText: {
    marginBottom: 2,
  },
  warrantyNote: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.6,
    marginTop: 4,
    marginBottom: 12,
  },
});

interface ServiceAgreementPDFProps {
  customer: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
  };
  totalPrice: number;
  installationDate: string;
  signatureDataUrl?: string;
  date: string;
}

export default function ServiceAgreementPDF({
  customer,
  totalPrice,
  installationDate,
  signatureDataUrl,
  date,
}: ServiceAgreementPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>PLATINUM INSTALLS</Text>
            <Text style={styles.tagline}>Service Agreement</Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{customer.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Service Address:</Text>
            <Text style={styles.value}>{customer.street}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>City, State, ZIP:</Text>
            <Text style={styles.value}>{customer.city}, {customer.state} {customer.zip}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone/Email:</Text>
            <Text style={styles.value}>{customer.phone} / {customer.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{installationDate}</Text>
          </View>
        </View>

        {/* 1. Scope of Work */}
        <View style={styles.scopeSection}>
          <Text style={styles.scopeTitle}>1. Scope of Work</Text>
          <Text style={styles.scopeText}>
            Platinum Installs ("Contractor") agrees to provide professional epoxy flooring installation services as described in the approved estimate. Work may include surface preparation, base coat application, flake broadcast, and topcoat sealing.
          </Text>
        </View>

        {/* 2. Materials & Workmanship */}
        <View style={styles.scopeSection}>
          <Text style={styles.scopeTitle}>2. Materials & Workmanship</Text>
          <Text style={styles.scopeText}>
            All materials used are premium-grade and applied according to manufacturer specifications. Contractor guarantees professional, workmanlike performance with a promise to repair any failures due to improper installation upto, but not beyond, 15 years after the date of installation. The option to purchase a limited warranty for the material covers peeling, delamination, or coating failure under normal residential use.
          </Text>
        </View>

        {/* 3. Customer Responsibilities */}
        <View style={styles.scopeSection}>
          <Text style={styles.scopeTitle}>3. Customer Responsibilities</Text>
          <Text style={styles.scopeText}>
            Customer agrees to: ensure the garage is clean, empty, and accessible, with the exception that the Contractor agrees to move specified objects before installation; provide power and water; avoid foot traffic for 24 hours and vehicle traffic for 72 hours. A $200 delay fee applies if the garage is not ready on installation day. Failure to meet these conditions may delay the project or void warranty coverage.
          </Text>
        </View>

        {/* 4. Payment Terms */}
        <View style={styles.scopeSection}>
          <Text style={styles.scopeTitle}>4. Payment Terms</Text>
          <Text style={styles.scopeText}>Total Contract Price:</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Contract Total:</Text>
            <Text style={styles.priceValue}>${totalPrice.toFixed(2)}</Text>
          </View>
          <Text style={styles.scopeText}>
            A 50% deposit secures scheduling, balance due upon completion. Accepted payments: cash, check, or electronic transfer. Late payments over 5 days may incur a 5% fee.
          </Text>
        </View>

        {/* 5. Change Orders */}
        <View style={styles.scopeSection}>
          <Text style={styles.scopeTitle}>5. Change Orders</Text>
          <Text style={styles.scopeText}>
            Any additional work requested beyond the original scope must be approved in writing and may adjust pricing or schedule.
          </Text>
        </View>

        {/* 6. Warranty Exclusions */}
        <View style={styles.scopeSection}>
          <Text style={styles.scopeTitle}>6. Warranty Exclusions</Text>
          <Text style={styles.scopeText}>
            Warranty excludes damage caused by structural movement, water intrusion, hydrostatic pressure, chemical spills, or customer negligence.
          </Text>
        </View>

        {/* 7. Liability */}
        <View style={styles.scopeSection}>
          <Text style={styles.scopeTitle}>7. Liability</Text>
          <Text style={styles.scopeText}>
            Contractor carries full liability coverage. Customer agrees that Contractor's liability shall not exceed total contract price.
          </Text>
        </View>

        {/* 8. Cancellation */}
        <View style={styles.scopeSection}>
          <Text style={styles.scopeTitle}>8. Cancellation</Text>
          <Text style={styles.scopeText}>
            Cancellations within 48 hours of the scheduled service date may result in forfeiture of the deposit due to material and scheduling costs.
          </Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              {signatureDataUrl && (
                <Image src={signatureDataUrl} style={{ width: '100%', height: 50, marginBottom: 8 }} />
              )}
              <Text style={styles.signatureLabel}>Customer Signature</Text>
              <Text style={styles.dateField}>Date: {date}</Text>
            </View>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>Contractor Signature</Text>
              <Text style={styles.dateField}>Date: _______________</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Platinum Installs | Dallas–Fort Worth, TX | (949) 289-4375 | platinuminstallsdfw@gmail.com</Text>
          <Text style={styles.footerText}>Honest, Reliable, Admirable</Text>
        </View>
      </Page>
    </Document>
  );
}

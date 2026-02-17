const { Pilgrimage } = require("../../models/pilgrimage");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePilgrimagePdf = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch holiday package
    const pilgrimagePackage = await Pilgrimage.findById(id).lean();

    if (!pilgrimagePackage) {
      return res.status(404).send("Holiday package not found");
    }

    // Create a PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      bufferPages: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${pilgrimagePackage.packageName.replace(/[^a-z0-9]/gi, '_')}_package.pdf"`
    );

    // Pipe the PDF to response
    doc.pipe(res);

    // Add fonts (using default, but you can add custom fonts)
    // If you want custom fonts, add them like this:
    // doc.font('fonts/Poppins-Regular.ttf');

    // Helper function for multiline text
    const addMultilineText = (text, x, y, maxWidth, lineHeight = 18) => {
      const lines = doc.font('Helvetica').fontSize(10).text(text, x, y, {
        width: maxWidth,
        align: 'left',
        lineGap: 2
      });
      return lines;
    };

    // Helper function to draw rounded rectangle
    const drawRoundedRect = (x, y, width, height, radius = 5) => {
      doc
        .moveTo(x + radius, y)
        .lineTo(x + width - radius, y)
        .quadraticCurveTo(x + width, y, x + width, y + radius)
        .lineTo(x + width, y + height - radius)
        .quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
        .lineTo(x + radius, y + height)
        .quadraticCurveTo(x, y + height, x, y + height - radius)
        .lineTo(x, y + radius)
        .quadraticCurveTo(x, y, x + radius, y)
        .closePath();
    };

    // Colors
    const colors = {
      primary: '#1a2980',
      secondary: '#26d0ce',
      accent: '#ff9a9e',
      success: '#4CAF50',
      warning: '#FF9800',
      danger: '#f44336',
      light: '#f5f7fa',
      dark: '#2c3e50'
    };

    // Page 1: Cover Page
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f5f7fa');
    
    // Gradient effect
    doc.fillColor(colors.primary)
       .rect(0, 0, doc.page.width, 300)
       .fill();
    
    doc.fillColor(colors.secondary, 0.7)
       .rect(0, 250, doc.page.width, 200)
       .fill();
    
    // Decorative elements
    doc.circle(600, 100, 80).fill(colors.accent, 0.3);
    doc.circle(100, 500, 60).fill(colors.secondary, 0.3);
    doc.circle(400, 600, 70).fill(colors.primary, 0.2);
    
    // Package Name (Centered)
    doc.font('Helvetica-Bold')
       .fontSize(36)
       .fillColor('white')
       .text(pilgrimagePackage.packageName, 50, 180, {
         width: doc.page.width - 100,
         align: 'center',
         lineGap: 10
       });
    
    // Subtitle
    doc.font('Helvetica')
       .fontSize(18)
       .fillColor('white', 0.9)
       .text('Premium Travel Experience', 50, 280, {
         width: doc.page.width - 100,
         align: 'center'
       });
    
    // Duration and details
    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor('white')
       .text(
         `${pilgrimagePackage.packageDuration.days} Days / ${pilgrimagePackage.packageDuration.nights} Nights`,
         50, 350, { align: 'center' }
       );
    
    // Bottom info
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('white', 0.8)
       .text(
         `Starting from: ${pilgrimagePackage.startCity} | Package ID: ${pilgrimagePackage.uniqueId}`,
         50, 380, { align: 'center' }
       );
    
    // Decorative line
    doc.strokeColor('white')
       .lineWidth(2)
       .moveTo(150, 420)
       .lineTo(doc.page.width - 150, 420)
       .stroke();
    
    // Footer on cover
    doc.font('Helvetica-Oblique')
       .fontSize(10)
       .fillColor('white', 0.7)
       .text('Your Journey Begins Here', 50, doc.page.height - 50, {
         width: doc.page.width - 100,
         align: 'center'
       });
    
    // Add new page for content
    doc.addPage();
    
    // Page 2: Package Details
    // Header with gradient
    doc.rect(0, 0, doc.page.width, 100)
       .fill(colors.primary);
    
    doc.font('Helvetica-Bold')
       .fontSize(24)
       .fillColor('white')
       .text('Package Details', 50, 40);
    
    // Content starts at y = 120
    let currentY = 120;
    
    // Package Info Cards
    const cardWidth = (doc.page.width - 100) / 2;
    const cardHeight = 80;
    
    // Card 1: Duration
    drawRoundedRect(50, currentY, cardWidth, cardHeight, 8);
    doc.fill(colors.light);
    doc.strokeColor('#ddd').stroke();
    
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor(colors.dark)
       .text('Duration', 70, currentY + 20);
    
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor(colors.primary)
       .text(
         `${pilgrimagePackage.packageDuration.days} Days`,
         70, currentY + 40
       );
    
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor(colors.primary)
       .text(
         `${pilgrimagePackage.packageDuration.nights} Nights`,
         70, currentY + 60
       );
    
    // Card 2: Package Type
    drawRoundedRect(50 + cardWidth + 10, currentY, cardWidth, cardHeight, 8);
    doc.fill(colors.light);
    doc.strokeColor('#ddd').stroke();
    
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor(colors.dark)
       .text('Package Type', 70 + cardWidth + 10, currentY + 20);
    
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor(colors.primary)
       .text(pilgrimagePackage.packageType, 70 + cardWidth + 10, currentY + 45);
    
    // Card 3: Start City
    drawRoundedRect(50, currentY + cardHeight + 15, cardWidth, cardHeight, 8);
    doc.fill(colors.light);
    doc.strokeColor('#ddd').stroke();
    
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor(colors.dark)
       .text('Start City', 70, currentY + cardHeight + 35);
    
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor(colors.primary)
       .text(pilgrimagePackage.startCity, 70, currentY + cardHeight + 55);
    
    // Card 4: Unique ID
    drawRoundedRect(50 + cardWidth + 10, currentY + cardHeight + 15, cardWidth, cardHeight, 8);
    doc.fill(colors.light);
    doc.strokeColor('#ddd').stroke();
    
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor(colors.dark)
       .text('Package ID', 70 + cardWidth + 10, currentY + cardHeight + 35);
    
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor(colors.primary)
       .text(pilgrimagePackage.uniqueId, 70 + cardWidth + 10, currentY + cardHeight + 55);
    
    // Move Y position
    currentY += cardHeight * 2 + 40;
    
    // Highlights Section
    doc.font('Helvetica-Bold')
       .fontSize(18)
       .fillColor(colors.dark)
       .text('Package Highlights', 50, currentY);
    
    currentY += 30;
    
    drawRoundedRect(50, currentY, doc.page.width - 100, 100, 8);
    doc.fill(colors.light);
    doc.strokeColor('#ddd').stroke();
    
    doc.font('Helvetica')
       .fontSize(11)
       .fillColor(colors.dark)
       .text(pilgrimagePackage.highlights, 65, currentY + 20, {
         width: doc.page.width - 130,
         lineGap: 4
       });
    
    currentY += 130;
    
    // Add new page if needed
    if (currentY > 600) {
      doc.addPage();
      currentY = 50;
    }
    
    // Includes & Excludes
    doc.font('Helvetica-Bold')
       .fontSize(18)
       .fillColor(colors.dark)
       .text('What\'s Included & Excluded', 50, currentY);
    
    currentY += 30;
    
    const sectionWidth = (doc.page.width - 120) / 2;
    
    // Includes box
    drawRoundedRect(50, currentY, sectionWidth, 120, 8);
    doc.fill('#e8f5e9');
    doc.strokeColor(colors.success).stroke();
    
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .fillColor(colors.success)
       .text('✓ Included', 70, currentY + 20);
    
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor(colors.dark)
       .text(pilgrimagePackage.include || 'All major amenities and services', 70, currentY + 45, {
         width: sectionWidth - 40,
         lineGap: 3
       });
    
    // Excludes box
    drawRoundedRect(70 + sectionWidth, currentY, sectionWidth, 120, 8);
    doc.fill('#ffebee');
    doc.strokeColor(colors.danger).stroke();
    
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .fillColor(colors.danger)
       .text('✗ Excluded', 90 + sectionWidth, currentY + 20);
    
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor(colors.dark)
       .text(pilgrimagePackage.exclude || 'Personal expenses and optional activities', 90 + sectionWidth, currentY + 45, {
         width: sectionWidth - 40,
         lineGap: 3
       });
    
    currentY += 150;
    
    // Page 3: Vehicles
    doc.addPage();
    
    // Page header
    doc.rect(0, 0, doc.page.width, 100)
       .fill(colors.primary);
    
    doc.font('Helvetica-Bold')
       .fontSize(24)
       .fillColor('white')
       .text('Available Vehicles', 50, 40);
    
    currentY = 120;
    
    if (pilgrimagePackage.availableVehicle.length > 0) {
      doc.font('Helvetica-Bold')
         .fontSize(16)
         .fillColor(colors.dark)
         .text('Transportation Options', 50, currentY);
      
      currentY += 30;
      
      pilgrimagePackage.availableVehicle.forEach((vehicle, index) => {
        if (currentY > 650) {
          doc.addPage();
          currentY = 50;
        }
        
        drawRoundedRect(50, currentY, doc.page.width - 100, 80, 8);
        doc.fill(index % 2 === 0 ? colors.light : '#f0f0f0');
        doc.strokeColor(colors.secondary).stroke();
        
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .fillColor(colors.primary)
           .text(vehicle.vehicleType, 70, currentY + 20);
        
        doc.font('Helvetica')
           .fontSize(11)
           .fillColor(colors.dark)
           .text(`Brand: ${vehicle.brandName}`, 70, currentY + 40);
        
        doc.font('Helvetica')
           .fontSize(11)
           .fillColor(colors.dark)
           .text(`Seats: ${vehicle.seatLimit}`, 70, currentY + 55);
        
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor(colors.success)
           .text(`₹${vehicle.price}`, doc.page.width - 120, currentY + 35);
        
        currentY += 100;
      });
    } else {
      doc.font('Helvetica')
         .fontSize(12)
         .fillColor(colors.dark, 0.7)
         .text('No vehicle information available', 50, currentY);
      currentY += 30;
    }
    
    // Page 4: Itinerary
    doc.addPage();
    
    // Page header
    doc.rect(0, 0, doc.page.width, 100)
       .fill(colors.primary);
    
    doc.font('Helvetica-Bold')
       .fontSize(24)
       .fillColor('white')
       .text('Day-wise Itinerary', 50, 40);
    
    currentY = 120;
    
    if (pilgrimagePackage.itinerary.length > 0) {
      pilgrimagePackage.itinerary.forEach((day, index) => {
        if (currentY > 650) {
          doc.addPage();
          currentY = 50;
          
          // Add header for continuation pages
          doc.rect(0, 0, doc.page.width, 60)
             .fill(colors.primary, 0.1);
          
          doc.font('Helvetica-Bold')
             .fontSize(16)
             .fillColor(colors.primary)
             .text('Itinerary (Continued)', 50, 20);
        }
        
        // Day header
        drawRoundedRect(50, currentY, doc.page.width - 100, 40, 8);
        doc.fill(colors.primary);
        
        doc.font('Helvetica-Bold')
           .fontSize(16)
           .fillColor('white')
           .text(`Day ${day.dayNo}: ${day.title}`, 70, currentY + 12);
        
        currentY += 50;
        
        if (day.subtitle) {
          doc.font('Helvetica-Oblique')
             .fontSize(12)
             .fillColor(colors.secondary)
             .text(day.subtitle, 70, currentY);
          currentY += 20;
        }
        
        // Description
        doc.font('Helvetica')
           .fontSize(11)
           .fillColor(colors.dark)
           .text(day.description, 70, currentY, {
             width: doc.page.width - 140,
             lineGap: 3
           });
        
        // Calculate height of description
        const descHeight = doc.heightOfString(day.description, {
          width: doc.page.width - 140,
          lineGap: 3
        });
        currentY += descHeight + 15;
        
        // Details
        if (day.stay) {
          doc.font('Helvetica-Bold')
             .fontSize(10)
             .fillColor(colors.dark)
             .text('🏨 Accommodation: Included', 70, currentY);
          currentY += 15;
        }
        
        if (day.mealsIncluded?.length > 0) {
          doc.font('Helvetica-Bold')
             .fontSize(10)
             .fillColor(colors.dark)
             .text(`🍽️ Meals: ${day.mealsIncluded.join(', ')}`, 70, currentY);
          currentY += 15;
        }
        
        if (day.transport?.type) {
          doc.font('Helvetica-Bold')
             .fontSize(10)
             .fillColor(colors.dark)
             .text(`🚗 Transport: ${day.transport.type}`, 70, currentY);
          currentY += 15;
        }
        
        if (day.placesToVisit?.length > 0) {
          doc.font('Helvetica-Bold')
             .fontSize(10)
             .fillColor(colors.dark)
             .text('📍 Places to Visit:', 70, currentY);
          currentY += 15;
          
          day.placesToVisit.forEach(place => {
            doc.font('Helvetica')
               .fontSize(9)
               .fillColor(colors.dark, 0.8)
               .text(`• ${place}`, 85, currentY);
            currentY += 12;
          });
        }
        
        currentY += 20;
        
        // Add separator line
        doc.strokeColor('#eee')
           .lineWidth(1)
           .moveTo(50, currentY)
           .lineTo(doc.page.width - 50, currentY)
           .stroke();
        
        currentY += 20;
      });
    } else {
      doc.font('Helvetica')
         .fontSize(12)
         .fillColor(colors.dark, 0.7)
         .text('No itinerary information available', 50, currentY);
    }
    
    // Final Page: Contact Information
    doc.addPage();
    
    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height)
       .fill(colors.primary);
    
    // Decorative elements
    doc.circle(100, 100, 60).fill('white', 0.1);
    doc.circle(doc.page.width - 100, 200, 80).fill('white', 0.1);
    doc.circle(200, doc.page.height - 100, 70).fill('white', 0.1);
    
    // Main content
    doc.font('Helvetica-Bold')
       .fontSize(36)
       .fillColor('white')
       .text('Ready to Book?', 50, 150, {
         width: doc.page.width - 100,
         align: 'center'
       });
    
    doc.font('Helvetica')
       .fontSize(18)
       .fillColor('white', 0.9)
       .text('Contact us for more information and bookings', 50, 220, {
         width: doc.page.width - 100,
         align: 'center'
       });
    
    // Contact cards
    const contactY = 300;
    
    // Phone
    drawRoundedRect(100, contactY, doc.page.width - 200, 60, 10);
    doc.fill('white', 0.2);
    doc.strokeColor('white').stroke();
    
    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor('white')
       .text('📞 Call Us', 120, contactY + 20);
    
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('white', 0.9)
       .text('+1-234-567-8900', 300, contactY + 20);
    
    // Email
    drawRoundedRect(100, contactY + 80, doc.page.width - 200, 60, 10);
    doc.fill('white', 0.2);
    doc.strokeColor('white').stroke();
    
    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor('white')
       .text('✉️ Email Us', 120, contactY + 100);
    
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('white', 0.9)
       .text('bookings@travelcompany.com', 300, contactY + 100);
    
    // Website
    drawRoundedRect(100, contactY + 160, doc.page.width - 200, 60, 10);
    doc.fill('white', 0.2);
    doc.strokeColor('white').stroke();
    
    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor('white')
       .text('🌐 Visit Us', 120, contactY + 180);
    
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('white', 0.9)
       .text('www.travelcompany.com', 300, contactY + 180);
    
    // Footer info
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('white', 0.7)
       .text(
         `Package ID: ${pilgrimagePackage.uniqueId} | Generated on: ${new Date().toLocaleDateString()}`,
         50, doc.page.height - 50, {
           width: doc.page.width - 100,
           align: 'center'
         }
       );
    
    // Add page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Don't add page number to cover or last page
      if (i > 0 && i < pages.count - 1) {
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.dark, 0.5)
           .text(
             `Page ${i} of ${pages.count - 2}`,
             doc.page.width - 100,
             doc.page.height - 40
           );
      }
    }
    
    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.log("PDF Generation Error:", error);
    res.status(500).send("Failed to generate PDF");
  }
};

module.exports = { generatePilgrimagePackagePdf: generatePilgrimagePdf };
import sendEmail from "./sendPdfEmail.js";
import PDFDocument from "pdfkit";
import fs from "fs";

// Helper function to create a password-protected PDF using pdfkit
async function createPasswordProtectedPDF(content, password) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ 
            ownerPassword: password,
            userPassword: password,
            permissions: {
                printing: "lowResolution", // Allow low-res printing only
                modifying: false,
                copying: false,
            },
        });

        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        doc.on("error", (error) => {
            reject(error);
        });

        // Add text to the PDF
        doc.font("Helvetica").fontSize(12).text(content, 50, 50);

        // Finalize the PDF file
        doc.end();
    });
}

// Function to send the password-protected PDF via email
export async function sendPdf(email, text, subject, password) {
    try {
        // Generate the password-protected PDF
        const pdfBuffer = await createPasswordProtectedPDF(text, password);

        // Send the PDF via email
        await sendEmail(
            email,
            subject,
            "Please find the attached PDF file with the interview details.\n\nThe password is the last 4 digits of your Pan Number.",
            pdfBuffer
        );

        console.log("PDF sent successfully!");
    } catch (error) {
        console.error("Error:", error);
    }
}
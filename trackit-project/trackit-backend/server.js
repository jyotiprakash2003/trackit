const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const cors = require('cors');

const app = express();
const port = 3001;

// Use multer for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

app.post('/api/parse-syllabus', upload.single('syllabus'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const data = await pdf(req.file.buffer);
        const text = data.text;

        // --- EXTRACTING HIGH-LEVEL INFORMATION ---

        // Regex to find course code and name, e.g., "BCSE408L Cloud Computing"
        const titleRegex = /([A-Z]{4}\d{3,4}L)\s+([A-Za-z\s-&]+?)\s+\(/;
        const titleMatch = text.match(titleRegex);
        const courseName = titleMatch ? `${titleMatch[1]} ${titleMatch[2].trim()}` : 'Syllabus';

        // Regex to find total lecture hours, defaulting to 45 if not found
        const totalHoursRegex = /Total Lecture hours:\s*(\d+)\s*hours/;
        const totalHoursMatch = text.match(totalHoursRegex);
        const totalHours = totalHoursMatch ? parseInt(totalHoursMatch[1], 10) : 45;

        // Split the entire text by "Module:" to get individual module blocks
        const moduleBlocks = text.split('Module:');
        
        // --- NEW DETAILED PARSING LOGIC ---

        const topics = moduleBlocks.slice(1).map((block, index) => {
            const lines = block.trim().split('\n');
            const firstLine = lines[0];

            // Regex to capture module title and hours from the first line
            const moduleHeaderRegex = /^\d+\s*(.*?)\s*(\d+)\s*hours?/i;
            const headerMatch = firstLine.match(moduleHeaderRegex);

            let title = `Module ${index + 1}`;
            let hours = 0;
            // The rest of the block is the description
            let description = block.replace(firstLine, '').trim().replace(/\s+/g, ' ');

            if (headerMatch) {
                title = headerMatch[1].trim();
                hours = parseInt(headerMatch[2], 10);
            }

            // Calculate the total weightage for this entire module
            const topicWeightage = parseFloat(((hours / totalHours) * 100).toFixed(2));

            // ** ADVANCED SUBTOPIC SPLITTING **
            // Split the description by hyphens or common delimiters.
            // This regex looks for ' - ' or ', ' to split the topics.
            const subTopicStrings = description.split(/\s*-\s*|\s*–\s*|,/g)
                .map(s => s.trim())
                .filter(s => s.length > 5); // Filter out very short or empty strings

            let subTopics = [];
            if (subTopicStrings.length > 1) {
                // If we successfully split, distribute the weightage
                const distributedWeightage = parseFloat((topicWeightage / subTopicStrings.length).toFixed(2));
                subTopics = subTopicStrings.map((sub, i) => ({
                    id: `st${index + 1}-${i + 1}`,
                    title: sub.charAt(0).toUpperCase() + sub.slice(1), // Capitalize first letter
                    weightage: distributedWeightage,
                    completed: false,
                }));
            } else {
                // If no subtopics found, use the whole description as one item
                subTopics = [{
                    id: `st${index + 1}-1`,
                    title: description || "Overview of module content.",
                    weightage: topicWeightage,
                    completed: false,
                }];
            }

            return {
                id: `t${index + 1}`,
                title: title,
                topicWeightage: topicWeightage,
                subTopics: subTopics,
            };
        }).filter(topic => topic.topicWeightage > 0); // Remove any modules that couldn't be parsed

        const finalJson = {
            examName: courseName,
            // You can add logic to parse this from the PDF if available
            examDate: "2025-12-20T10:00:00",
            totalWeightage: 100,
            topics: topics,
        };

        res.json(finalJson);

    } catch (error) {
        console.error('Error parsing PDF:', error);
        res.status(500).json({ error: 'Failed to parse PDF.' });
    }
});

app.listen(port, () => {
    console.log(`Syllabus parsing server running at http://localhost:${port}`);
});


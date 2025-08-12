# 🚀 AI Resource Allocation Configurator

Transform spreadsheet chaos into organized, validated data with AI-powered insights and intelligent business rules.

## 🌟 Features

### 📊 **Intelligent Data Processing**
- **AI-Powered Column Mapping**: Automatically maps non-standard headers to correct data structures
- **Smart File Upload**: Supports CSV and XLSX files with intelligent parsing
- **Real-time Validation**: Comprehensive data validation with 12+ validation rules
- **Auto-Fix Capabilities**: Automatically corrects common formatting issues

### 🤖 **AI-Enhanced Functionality**
- **Natural Language Search**: Query your data using plain English
- **AI Rule Creator**: Convert natural language descriptions into business rules
- **Intelligent Suggestions**: AI-powered recommendations for data optimization
- **Pattern Detection**: Advanced validation with circular dependency detection

### 🎛️ **Business Rules Engine**
- **Visual Rule Builder**: Create complex business rules with an intuitive interface
- **Natural Language Processing**: Describe rules in plain English
- **Rule Types**: Co-run, slot restrictions, load limits, phase windows, and pattern matching
- **Real-time Validation**: Rules are validated against your data in real-time

### ⚖️ **Advanced Prioritization**
- **Weight Configuration**: Fine-tune allocation priorities with interactive sliders
- **Preset Profiles**: Quick-start templates for common allocation strategies
- **Custom Priorities**: Define your own priority schemes
- **Visual Feedback**: Real-time preview of priority impacts

### 📤 **Comprehensive Export**
- **Multiple Formats**: Export to Excel (.xlsx) or CSV
- **Clean Data**: All validation issues resolved before export
- **Rules Configuration**: Business rules exported as JSON
- **Complete Package**: Data + rules + prioritization settings in one export

## 🚀 Quick Start

### Option 1: Use Sample Data
1. Visit the [live demo](https://ai-resource-allocator.vercel.app)
2. Click "Load V1 Sample Data" or "Load V2 Sample Data"
3. Explore the features with pre-loaded data

### Option 2: Upload Your Own Data
1. Prepare your data files with these structures:

**clients.csv**

ClientID, ClientName, PriorityLevel, RequestedTaskIDs, GroupTag, AttributesJSON

**workers.csv**

WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel

**tasks.csv**

TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent

## 🛠️ Local Development
### Prerequisites
- Node.js 18+
- npm or yarn

## Installation
```bash
# Clone the GitHub repo
git clone https://github.com/ankitkommalapati/Data-Alchemist.git
cd ai-resource-allocator

# Install Dependencies
npm install

# Start the server
npm run dev
```
Visit http://localhost:3000 to see the application.

## 📋 Data Validation Rules
### The system performs comprehensive validation including:
- **Duplicate ID Detection:** Ensures unique identifiers
- **JSON Format Validation:** Validates AttributesJSON fields
- **Cross-Reference Checking:** Verifies task/worker relationships
- **Skill Coverage Analysis:** Ensures workers can perform required tasks
- **Phase Capacity Planning:** Prevents oversaturation
- **Circular Dependency Detection:** Identifies problematic task relationships
- **Data Type Validation:** Ensures correct data formats
- **Range Validation:** Validates numerical ranges and constraints

## 🎯 Use Cases
### Resource Planning
- Allocate team members to projects based on skills and availability
- Balance workloads across different phases of project execution
- Ensure critical tasks are assigned to qualified personnel
### Constraint Management
- Define business rules for resource allocation
- Handle complex scheduling requirements
- Manage capacity constraints and dependencies
### Data Quality Assurance
- Clean and validate spreadsheet data automatically
- Detect and fix common data entry errors
- Ensure data consistency across large datasets

## 🔧 Advanced Features
### AI-Powered Validation
- **Smart Error Detection:** Identifies issues beyond basic validation
- **Contextual Suggestions:** Provides intelligent recommendations
- **Pattern Recognition:** Detects complex business rule violations
### Natural Language Interface
- **Query Data:** "Find all high-priority clients in GroupA"
- **Create Rules:** "Tasks T12 and T14 should run together"
- **Modify Data:** Natural language data modification suggestions
### Export Capabilities
- **Excel Integration:** Multi-sheet exports with summary data
- **JSON Configuration:** Machine-readable business rules
- **Audit Trail:** Complete record of data transformations

## 📊 Sample Data
### The project includes two sample datasets:
- **V1 Dataset:** Basic resource allocation scenario
- **V2 Dataset:** Complex scenario with edge cases and validation challenges
### Both datasets demonstrate:
- Multi-group client organizations
- Diverse worker skill sets and availability
- Complex task dependencies and requirements
- Real-world data quality issues

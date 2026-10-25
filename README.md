# SocraticDSA Java Mentor

**Summary**
SocraticDSA Java Mentor is an open-source Discord bot designed to scale the structured debugging assistance often needed in engineering student communities. Instead of functioning as a standard code-generation assistant that provides immediate solutions, it acts as a strict technical mentor. The bot analyzes failing Java code for logic flaws, time complexity inefficiencies, or syntax errors, and outputs targeted conceptual questions that prompt students to evaluate their own logic.

**Benefits**
* **Encourages Independent Reasoning:** Withholds direct code corrections to help computer science students build authentic problem-solving skills for data structures and competitive programming.
* **Targeted Diagnostic Feedback:** Isolates the exact line number and technical root cause (e.g., `IndexOutOfBoundsException` or arithmetic overflow) before generating a Socratic hint.
* **Community Integration:** Operates directly within Discord study groups to provide real-time, peer-like mentoring and debugging assistance around the clock.
* **Cost-Effective Local Inference:** Runs entirely on local hardware using a LoRA adapter fine-tuned specifically for pedagogical code analysis, eliminating ongoing API costs.

**Tech Stack**
* **Target Language:** Java
* **Backend Development:** Python 3.10+, discord.py
* **AI & Machine Learning:** Gemma 4 (E4B variant), Unsloth, Hugging Face Transformers, PyTorch
* **Prototyping & Automation:** Google AI Studio, Google Antigravity

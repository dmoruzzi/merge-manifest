        document.getElementById('mergeButton').addEventListener('click', mergeFiles);

        function parseXML(text) {
            return new DOMParser().parseFromString(text, "application/xml");
        }

        function serializeXML(xml) {
            return new XMLSerializer().serializeToString(xml);
        }

        function readFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error(`Error reading file: ${file.name}`));
                reader.readAsText(file);
            });
        }

        async function mergeFiles() {
            const files = document.getElementById('files').files;
            if (files.length === 0) {
                alert("Please select one or more package.xml files.");
                return;
            }

            const namespace = "http://soap.sforce.com/2006/04/metadata";
            const mergedDoc = document.implementation.createDocument(namespace, 'Package', null);
            const rootMerged = mergedDoc.documentElement;
            const typesDict = {};

            try {
                for (let file of files) {
                    const xmlString = await readFile(file);
                    const doc = parseXML(xmlString);

                    const types = doc.getElementsByTagNameNS(namespace, 'types');
                    for (let typeElement of types) {
                        const name = typeElement.getElementsByTagNameNS(namespace, 'name')[0].textContent;
                        const members = Array.from(typeElement.getElementsByTagNameNS(namespace, 'members')).map(m => m.textContent);

                        if (!typesDict[name]) {
                            typesDict[name] = new Set();
                        }

                        members.forEach(member => typesDict[name].add(member));
                    }
                }

                for (let name in typesDict) {
                    const typesElement = mergedDoc.createElementNS(namespace, 'types');
                    typesDict[name].forEach(member => {
                        const memberElement = mergedDoc.createElementNS(namespace, 'members');
                        memberElement.textContent = member;
                        typesElement.appendChild(memberElement);
                    });

                    const nameElement = mergedDoc.createElementNS(namespace, 'name');
                    nameElement.textContent = name;
                    typesElement.appendChild(nameElement);

                    rootMerged.appendChild(typesElement);
                }

                const versionElement = mergedDoc.createElementNS(namespace, 'version');
                versionElement.textContent = '59.0';  // Set the version as needed
                rootMerged.appendChild(versionElement);

                const mergedXMLString = serializeXML(mergedDoc);
                const blob = new Blob([mergedXMLString], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const downloadLink = document.getElementById('downloadLink');
                downloadLink.href = url;
                downloadLink.download = 'merged_package.xml';
                downloadLink.style.display = 'block';
                downloadLink.textContent = 'Download Merged package.xml';
            } catch (error) {
                console.error(error);
                alert("An error occurred while merging the files. Please check the console for more details.");
            }
        }

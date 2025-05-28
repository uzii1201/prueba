const foldersView = document.getElementById('folders-view');
const filesView = document.getElementById('files-view');
const folderTitle = document.getElementById('folder-title');
const filesList = document.getElementById('files-list');

let currentFolder = null;

// Abrir carpeta y listar archivos
function openFolder(folder) {
  currentFolder = folder;
  folderTitle.textContent = `Carpeta: ${folder.charAt(0).toUpperCase() + folder.slice(1)}`;
  foldersView.classList.add('hidden');
  filesView.classList.remove('hidden');

  fetch(`/api/files/${folder}`)
    .then(res => res.json())
    .then(files => {
      filesList.innerHTML = '';
      if (files.length === 0) {
        filesList.textContent = 'No hay archivos.';
        return;
      }

      files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-item';

        // Nombre archivo con enlace para abrir en nueva pestaña
        const link = document.createElement('a');
        link.textContent = file.name;
        link.href = file.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        // Botón eliminar
        const btnDelete = document.createElement('button');
        btnDelete.textContent = 'Eliminar';
        btnDelete.onclick = () => {
          const password = prompt('Ingrese contraseña para eliminar archivo:');
          if (!password) return;
          fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder, filename: file.name, password }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.error) alert('Error: ' + data.error);
              else {
                alert(data.message);
                openFolder(folder);
              }
            })
            .catch(() => alert('Error en la petición'));
        };

        // Botón renombrar
        const btnRename = document.createElement('button');
        btnRename.textContent = 'Renombrar';
        btnRename.onclick = () => {
          const newName = prompt('Ingrese nuevo nombre para el archivo:', file.name);
          if (!newName || newName.trim() === '') return;
          const password = prompt('Ingrese contraseña para renombrar archivo:');
          if (!password) return;

          fetch('/api/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder, oldName: file.name, newName, password }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.error) alert('Error: ' + data.error);
              else {
                alert(data.message);
                openFolder(folder);
              }
            })
            .catch(() => alert('Error en la petición'));
        };

        div.appendChild(link);
        div.appendChild(btnRename);
        div.appendChild(btnDelete);

        filesList.appendChild(div);
      });
    })
    .catch(() => {
      filesList.textContent = 'Error cargando archivos.';
    });
}


// Subir archivo con contraseña
document.getElementById('upload-form').addEventListener('submit', e => {
  e.preventDefault();

  const folder = document.getElementById('folder-select').value;
  const fileInput = document.getElementById('file-input');
  const password = document.getElementById('password-upload').value;

  if (!fileInput.files.length) {
    alert('Seleccione un archivo para subir');
    return;
  }

  const formData = new FormData();
  formData.append('folder', folder);
  formData.append('file', fileInput.files[0]);
  formData.append('password', password);

  fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) alert('Error: ' + data.error);
      else {
        alert(data.message);
        document.getElementById('upload-form').reset();
        // Si se está viendo esa carpeta, recargarla
        if (folder === currentFolder) openFolder(folder);
      }
    })
    .catch(() => alert('Error en la subida'));
});

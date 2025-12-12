// Project Modal Component
const ProjectModal = {
    template: `
        <div class="modal-overlay" @click="$emit('close')" data-dev="ID: modal-project\nComp: Modal\nNote: 프로젝트 관리 모달창">
            <div class="modal-window" @click.stop>
                <div class="h-10 border-b border-ui-border flex items-center justify-between px-4 bg-bg-panel text-text-main font-bold">
                    프로젝트 관리 
                    <button @click="$emit('close')" class="win-btn close">
                        <i class="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                </div>
                <div class="flex-1 flex">
                    <div class="w-40 border-r border-ui-border p-2 bg-bg-hover">Folders...</div>
                    <div class="flex-1 bg-bg-dark p-4">Files...</div>
                </div>
            </div>
        </div>
    `
};

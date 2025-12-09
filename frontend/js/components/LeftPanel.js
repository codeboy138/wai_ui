export default {
    props: ['width'],
    template: `
        <aside class="bg-bg-panel flex flex-col relative border-r border-ui-border" 
               :style="{ width: width + 'px', minWidth: '180px' }"
               data-dev="ID: panel-left"
               v-show="true"> <div class="p-2 border-b border-ui-border font-bold text-text-sub flex justify-between items-center h-8" data-dev="ID: panel-left-header">
                </div>
            
            <div class="flex-1 overflow-y-auto p-2 flex flex-col items-center justify-center text-text-sub opacity-30 gap-2" data-dev="ID: empty-state">
                <i class="fa-solid fa-folder-open text-2xl"></i>
                <div class="text-[10px]">자산 목록이 비어있습니다.</div>
            </div>
            
            <div class="panel-resizer-v right-0" @mousedown="$emit('resize-start', $event)"></div>
        </aside>
    `
}
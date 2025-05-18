procedure render_plugin (
    p_item   in            apex_plugin.t_item,
    p_plugin in            apex_plugin.t_plugin,
    p_param  in            apex_plugin.t_item_render_param,
    p_result in out nocopy apex_plugin.t_item_render_result )
as
    l_item_name        varchar2(4000) := apex_plugin.get_input_name_for_page_item(false);
    l_item_value       varchar2(4000) := p_param.value;
    attr_sql_query     varchar2(4000) := p_item.attributes.get_varchar2('source');
    attr_map_region_id varchar2(4000) := p_item.attributes.get_varchar2('map_region');

    l_label            varchar2(4000);
    l_source_id        varchar2(4000);
    l_tiles_url        varchar2(4000);

    l_cursor           sys_refcursor;
    l_html             clob := '';
    l_json_sources     clob := '';
begin

    -- Hidden field (used for storing the selected value)
    l_html := l_html || '<input type="hidden" id="' || l_item_name || '" name="' || l_item_name || '" value="' || apex_escape.html(l_item_value) || '"/>';

    -- Output HTML
    htp.p(l_html);

    -- Generate JavaScript array of sources
    apex_json.initialize_clob_output;
    apex_json.open_array;

    open l_cursor for attr_sql_query;
    loop
        fetch l_cursor into l_label, l_source_id, l_tiles_url;
        exit when l_cursor%notfound;

        apex_json.open_object;
        apex_json.write('label', l_label);
        apex_json.write('source_id', l_source_id);
        apex_json.write('tiles_url', l_tiles_url);
        apex_json.close_object;
    end loop;
    close l_cursor;

    apex_json.close_array;

    -- Store the generated JSON into a CLOB variable
    l_json_sources := apex_json.get_clob_output;

    -- init call with sources and map_region_id as parameters
    apex_javascript.add_onload_code('window.mapBackgroundSwitcher.init("' || 
                                    l_item_name || '", "' || 
                                    l_item_value || '", ' || 
                                    l_json_sources || ', "' || 
                                    attr_map_region_id || '");');
    
    apex_json.free_output;
end render_plugin;

procedure render_plugin (
    p_item   in            apex_plugin.t_item,
    p_plugin in            apex_plugin.t_plugin,
    p_param  in            apex_plugin.t_item_render_param,
    p_result in out nocopy apex_plugin.t_item_render_result )
as
    l_item_name        varchar2(4000) := apex_plugin.get_input_name_for_page_item(false);
    l_item_value       varchar2(4000) := p_param.value;
    attr_sql_query     varchar2(4000) := p_item.attributes.get_varchar2('source');
    l_parent_region_id number := p_item.region_id;
    l_region_static_id apex_application_page_regions.static_id%type;
    l_region_type_name varchar2(100);

    l_label            varchar2(4000);
    l_source_id        varchar2(4000);
    l_tiles_url        varchar2(4000);

    l_cursor           sys_refcursor;
    l_html             clob := '';
    l_json_sources     clob := '';
begin
    select static_id, source_type
      into l_region_static_id, l_region_type_name
      from apex_application_page_regions
     where application_id = :APP_ID     
       and region_id      = l_parent_region_id;

    if l_region_type_name <> 'Map' then  
        raise_application_error(-20000, 'ERROR: The map page item "' || l_item_name || '" must be placed within a parent region of type "Map".');
    end if;

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
                                    l_region_static_id || '");');
    
    apex_json.free_output;
    exception
    when no_data_found then
        raise_application_error(-20000, 'ERROR: The map page item "' || l_item_name || '" must be placed within a parent region of type "Map".');
end render_plugin;

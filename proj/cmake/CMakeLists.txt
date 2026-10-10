cmake_minimum_required( VERSION 3.16 FATAL_ERROR )
set( CMAKE_VERBOSE_MAKEFILE ON )

# libc++ in current Xcode SDKs supports macOS 11 and later.
if( NOT CMAKE_OSX_DEPLOYMENT_TARGET )
	set( CMAKE_OSX_DEPLOYMENT_TARGET "11.0" CACHE STRING "macOS minimum deployment target" )
endif()

project( Gelbox )

# Cinder (v0.9.3 or later, built with CMake) is expected as a sibling of the
# Gelbox checkout, i.e. ../Cinder. Override with -DCINDER_PATH=... or $CINDER_PATH.
if( NOT CINDER_PATH )
	if( DEFINED ENV{CINDER_PATH} )
		set( CINDER_PATH "$ENV{CINDER_PATH}" )
	else()
		get_filename_component( CINDER_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../../../Cinder" ABSOLUTE )
	endif()
endif()
if( NOT EXISTS "${CINDER_PATH}/proj/cmake/modules/cinderMakeApp.cmake" )
	message( FATAL_ERROR "Cinder not found at '${CINDER_PATH}'. Clone https://github.com/cinder/Cinder next to the gelbox checkout, or pass -DCINDER_PATH=<path>." )
endif()

get_filename_component( APP_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../../" ABSOLUTE )

# Put Gelbox.app directly in the build directory instead of ci_make_app's
# default of proj/cmake/build/<config>.
set( CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}" )

include( "${CINDER_PATH}/proj/cmake/modules/cinderMakeApp.cmake" )

file( GLOB GELBOX_SOURCES "${APP_PATH}/src/*.cpp" )

set( GELBOX_ICON "${CMAKE_CURRENT_SOURCE_DIR}/Gelbox.icns" )

ci_make_app(
	APP_NAME    Gelbox
	CINDER_PATH ${CINDER_PATH}
	SOURCES     ${GELBOX_SOURCES}
	INCLUDES    "${APP_PATH}/include" "${APP_PATH}/src"
	ASSETS_PATH "${APP_PATH}/assets"
	RESOURCES   "${APP_PATH}/assets/Credits.rtf" "${GELBOX_ICON}"
)

# Force-include the prefix header the old Xcode project used as its PCH, so
# every translation unit sees Cinder's app and gl headers.
target_compile_options( Gelbox PRIVATE "SHELL:-include ${APP_PATH}/include/Gelbox_Prefix.h" )

if( APPLE )
	set_target_properties( Gelbox PROPERTIES
		MACOSX_BUNDLE_INFO_PLIST            "${CMAKE_CURRENT_SOURCE_DIR}/Info.plist.in"
		MACOSX_BUNDLE_GUI_IDENTIFIER        "org.douglaslab.Gelbox"
		MACOSX_BUNDLE_BUNDLE_NAME           "Gelbox"
		MACOSX_BUNDLE_ICON_FILE             "Gelbox.icns"
		MACOSX_BUNDLE_SHORT_VERSION_STRING  "1.0"
		MACOSX_BUNDLE_BUNDLE_VERSION        "1"
		MACOSX_BUNDLE_COPYRIGHT             "Copyright © 2018 Douglas Lab"
	)

	# Cinder on macOS looks for assets in Contents/Resources/assets before walking
	# up from the executable, and the old Xcode project copied assets/ there, so
	# Gelbox.app used to be self-contained. Without it a Gelbox.app copied out of
	# build/ finds no asset directory at all and aborts inside Cinder's image
	# loader. By default the bundle entry is a symlink to the repository assets/,
	# which keeps hot-reload working and survives cp -R / Finder copies on this
	# machine. Configure with -DCINDER_COPY_ASSETS=ON (the same switch Cinder uses
	# for the assets folder beside the app) to embed a real copy for distribution.
	set( GELBOX_BUNDLE_ASSETS "$<TARGET_BUNDLE_CONTENT_DIR:Gelbox>/Resources/assets" )
	if( CINDER_COPY_ASSETS )
		add_custom_command( TARGET Gelbox POST_BUILD
			COMMAND "${CMAKE_COMMAND}" -E remove_directory "${GELBOX_BUNDLE_ASSETS}"
			COMMAND "${CMAKE_COMMAND}" -E copy_directory "${APP_PATH}/assets" "${GELBOX_BUNDLE_ASSETS}"
			COMMENT "Copying assets into Gelbox.app/Contents/Resources"
		)
	else()
		add_custom_command( TARGET Gelbox POST_BUILD
			COMMAND "${CMAKE_COMMAND}" -E remove_directory "${GELBOX_BUNDLE_ASSETS}"
			COMMAND "${CMAKE_COMMAND}" -E create_symlink "${APP_PATH}/assets" "${GELBOX_BUNDLE_ASSETS}"
			COMMENT "Linking assets into Gelbox.app/Contents/Resources"
		)
	endif()
endif()
